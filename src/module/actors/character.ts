import { calculateStats } from "../utils";
import { SWNRBaseItem } from "../base-item";
import { SWNRBaseActor } from "../base-actor";
import { ValidatedDialog } from "../ValidatedDialog";
import { data } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/module.mjs";
import { Options } from "@league-of-foundry-developers/foundry-vtt-types/src/types/augments/simple-peer";
import { DocumentModificationOptions } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs";
import { SWNRSkill } from "../items/skill";

export class SWNRCharacterActor extends SWNRBaseActor<"character"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  prepareBaseData(): void {
    const data = this.data.data;
    calculateStats(data.stats);
    data.systemStrain.max = data.stats.con.total - data.systemStrain.permanent;

    const cyberware = <SWNRBaseItem<"cyberware">[]>(
      this.items.filter((i) => i.type === "cyberware")
    );
    let cyberwareStrain = 0;
    //Sum up cyberware strain. force to number
    cyberwareStrain = cyberware.reduce(
      (i, n) => i + Number(n.data.data.strain),
      0
    );

    data.systemStrain.max -= cyberwareStrain;
    data.systemStrain.cyberware = cyberwareStrain;

    if (!data.save) data.save = {};
    const save = data.save;
    const base = 16 - data.level.value;
    save.physical = Math.max(
      1,
      base - Math.max(data.stats.str.mod, data.stats.con.mod)
    );
    save.evasion = Math.max(
      1,
      base - Math.max(data.stats.dex.mod, data.stats.int.mod)
    );
    save.mental = Math.max(
      1,
      base - Math.max(data.stats.wis.mod, data.stats.cha.mod)
    );
    save.luck = Math.max(1, base);

    data.access.max = data.stats.int.mod;
    // If the character has a program skill add it
    const programSkill = <SWNRBaseItem<"skill">[]>(
      this.items
        .filter((i) => i.type === "skill")
        .filter((i) => i.data.name === "Program")
    );
    if (programSkill && programSkill.length == 1) {
      data.access.max += programSkill[0].data.data.rank;
    }
  }
  prepareDerivedData(): void {
    const data = this.data.data;
    const useCWNArmor = game.settings.get("swnr", "useCWNArmor") ? true : false;
    if (data.settings == null) {
      data.settings = {
        useCWNArmor: useCWNArmor,
      };
    } else {
      data.settings.useCWNArmor = useCWNArmor;
    }

    // AC
    const armor = <SWNRBaseItem<"armor">[]>(
      this.items.filter(
        (i) =>
          i.data.type === "armor" &&
          i.data.data.use &&
          i.data.data.location === "readied"
      )
    );
    const shields = armor.filter((i) => i.data.data.shield);
    const baseAc = Math.max(
      data.baseAc,
      ...armor.map(
        (i) =>
          i.data.data.ac +
          (shields.filter((s) => s.id !== i.id).length !== 0 ? 1 : 0)
      )
    );
    data.ac = baseAc + data.stats.dex.mod;
    if (useCWNArmor) {
      const baseMeleeAc = Math.max(
        data.baseAc,
        ...armor.map(
          (i) =>
            i.data.data.meleeAc +
            (shields.filter((s) => s.id !== i.id).length !== 0 ? 1 : 0)
        )
      );
      data.meleeAc = baseMeleeAc + data.stats.dex.mod;
    }

    // effort
    const psychicSkills = <SWNRBaseItem<"skill">[]>(
      this.items.filter(
        (i) =>
          i.data.type === "skill" &&
          i.data.data.source.toLocaleLowerCase() ===
            game.i18n.localize("swnr.skills.labels.psionic").toLocaleLowerCase()
      )
    );
    const effort = data.effort;
    effort.max =
      Math.max(
        1,
        1 +
          Math.max(data.stats.con.mod, data.stats.wis.mod) +
          Math.max(0, ...psychicSkills.map((i) => i.data.data.rank))
      ) + effort.bonus;
    effort.value = effort.max - effort.current - effort.scene - effort.day;

    // extra effort
    const extraEffort = data.tweak.extraEffort;
    extraEffort.value =
      extraEffort.max -
      extraEffort.current -
      extraEffort.scene -
      extraEffort.day;

    //encumbrance
    if (!data.encumbrance)
      data.encumbrance = {
        ready: { max: 0, value: 0 },
        stowed: { max: 0, value: 0 },
      };
    const encumbrance = data.encumbrance;
    encumbrance.ready.max = Math.floor(data.stats.str.total / 2);
    encumbrance.stowed.max = data.stats.str.total;
    const inventory = <SWNRBaseItem<"item" | "armor" | "weapon">[]>(
      this.items.filter(
        (i) => i.type === "item" || i.type === "weapon" || i.type === "armor"
      )
    );
    const itemInvCost = function (
      i: SWNRBaseItem<"item" | "armor" | "weapon">
    ): number {
      let itemSize = 1;
      if (i.data.type === "item") {
        const itemData = i.data.data;
        const bundle = itemData.bundle;
        itemSize = Math.ceil(
          itemData.quantity / (bundle.bundled ? bundle.amount : 1)
        );
      } else {
        if (i.data.data.quantity) {
          // Weapons and armor can have qty
          itemSize = i.data.data.quantity;
        }
      }
      return itemSize * i.data.data.encumbrance;
    };
    encumbrance.ready.value = inventory
      .filter((i) => i.data.data.location === "readied")
      .map(itemInvCost)
      .reduce((i, n) => i + n, 0);
    encumbrance.stowed.value = inventory
      .filter((i) => i.data.data.location === "stowed")
      .map(itemInvCost)
      .reduce((i, n) => i + n, 0);

    const powers = <SWNRBaseItem<"power">[]>(
      this.items.filter((i) => i.type == "power")
    );

    powers.sort(function (a, b) {
      if (a.data.data.source == b.data.data.source) {
        return a.data.data.level - b.data.data.level;
      } else {
        return a.data.data.source.localeCompare(b.data.data.source);
      }
    });
    data["powers"] = powers;

    const favs = <SWNRBaseItem[]>(
      this.items.filter((i) => i.data.data["favorite"])
    );
    data["favorites"] = favs;
  }

  async rollSave(save: string): Promise<void> {
    const target = <number>this.data.data.save[save];
    if (isNaN(target)) {
      ui.notifications?.error("Unable to find save: " + save);
      return;
    }
    const template = "systems/swnr/templates/dialogs/roll-save.html";
    const title = game.i18n.format("swnr.titles.savingThrow", {
      throwType: game.i18n.localize("swnr.sheet.saves." + save),
    });
    const dialogData = {};
    const html = await renderTemplate(template, dialogData);
    const _doRoll = async (html: HTMLFormElement) => {
      const rollMode = game.settings.get("core", "rollMode");
      const form = <HTMLFormElement>html[0].querySelector("form");
      const modString = (<HTMLInputElement>(
        form.querySelector('[name="modifier"]')
      )).value;
      const modifier = parseInt(modString);
      if (isNaN(modifier)) {
        ui.notifications?.error(`Error, modifier is not a number ${modString}`);
        return;
      }
      // old approach const formula = `1d20cs>=(@target - @modifier)`;
      const formula = `1d20`;
      const roll = new Roll(formula, {
        modifier,
        target: target,
      });
      await roll.roll({ async: true });
      const success = roll.total ? roll.total >= target - modifier : false;
      const save_text = game.i18n.format(
        success
          ? game.i18n.localize("swnr.npc.saving.success")
          : game.i18n.localize("swnr.npc.saving.failure"),
        { actor: this.name, target: target - modifier }
      );
      const chatTemplate = "systems/swnr/templates/chat/save-throw.html";
      const chatDialogData = {
        saveRoll: await roll.render(),
        title,
        save_text,
        success,
      };
      const chatContent = await renderTemplate(chatTemplate, chatDialogData);
      const chatData = {
        speaker: ChatMessage.getSpeaker(),
        roll: JSON.stringify(roll),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      };
      getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
      getDocumentClass("ChatMessage").create(chatData);
      // roll.toMessage(
      //   {
      //     speaker: ChatMessage.getSpeaker(),
      //     flavor: title,
      //   },
      //   { rollMode }
      // );
      // return roll;
    };
    const popUpDialog = new ValidatedDialog(
      {
        title: title,
        content: html,
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.localize("swnr.chat.roll"),
            callback: _doRoll,
          },
        },
      },
      {
        failCallback: () => {
          return;
        },
        classes: ["swnr"],
      }
    );
    const s = popUpDialog.render(true);
    if (s instanceof Promise) await s;
    return;
  }

  getSkill(skill: string): SWNRBaseItem<"skill"> | null {
    const skillItem = <SWNRBaseItem<"skill">[]>(
      this.items
        .filter((i) => i.type === "skill")
        .filter((i) => i.data.name === skill)
    );
    if (skillItem && skillItem.length == 1) {
      return skillItem[0];
    }
    return null; //skill not found
  }

  _onUpdate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    data: any,
    options: DocumentModificationOptions,
    userId: string
  ): void {
    if (this.data.data.cyberdecks && this.data.data.cyberdecks.length > 0) {
      for (const deckId of this.data.data.cyberdecks) {
        const deck = game.actors?.get(deckId);
        if (deck) {
          deck.sheet?.render();
        }
      }
    }
    super._onUpdate(data, options, userId);
  }

  async _onCreate(): Promise<void> {
    await this.update({
      "token.actorLink": true,
    });
  }
}

// canvas.tokens.controlled[0].actor.update({ data: { effort: { bonus: 0, value: 0, scene: 0, day: 0 } } })
export const document = SWNRCharacterActor;
export const name = "character";
