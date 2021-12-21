import { SWNRCharacterActor } from "./character";
import { calculateStats, initSkills, limitConcurrency } from "../utils";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRBaseItem } from "../base-item";
import { SWNRStats, SWNRStatBase, SWNRStatComputed } from "../actor-types";
import { BaseActorSheet } from "../actor-base-sheet";

interface CharacterActorSheetData extends ActorSheet.Data {
  weapons?: Item[];
  armor?: Item[];
  gear?: Item[];
  skills?: Item[];
  useHomebrewLuckSave: boolean;
  itemTypes: SWNRCharacterActor["itemTypes"];
}
// < SWNRCharacterData, SWNRCharacterActor>
export class CharacterActorSheet extends BaseActorSheet<CharacterActorSheetData> {
  object: SWNRCharacterActor;

  _injectHTML(html: JQuery<HTMLElement>): void {
    html
      .find(".window-content")
      .addClass(["cq", "overflow-y-scroll", "relative"]);
    super._injectHTML(html);
  }

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "character", "test broken"],
      template: "systems/swnr/templates/actors/character-sheet.html",
      width: 750,
      height: 600,
      tabs: [
        {
          navSelector: ".pc-sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "combat",
        },
      ],
    });
  }
  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html
      .find(".resource-list-val")
      .on("change", this._onResourceName.bind(this));
    html
      .find(".resource-delete")
      .on("click", this._onResourceDelete.bind(this));
    html.find(".statRoll").on("click", this._onStatsRoll.bind(this));
    html.find(".skill").on("click", this._onSkillRoll.bind(this));
    html.find(".save").on("click", this._onSaveThrow.bind(this));
    html.find(".item-level-up").on("click", this._onItemLevelUp.bind(this));
    html
      .find(".resource-create")
      .on("click", this._onResourceCreate.bind(this));
    html
      .find(".hp-label")
      .on("click", limitConcurrency(this._onHpRoll.bind(this)));
    html.find(".rest-button").on("click", this._onRest.bind(this));
    html
      .find('[name="data.health.max"]')
      .on("input", this._onHPMaxChange.bind(this));
    html
      .find(".item.weapon .item-name")
      .on("click", this._onWeaponRoll.bind(this));
    html.find(".skill-load-button").on("click", this._onLoadSkills.bind(this));
    // Drag events for macros.
    if (this.actor.isOwner) {
      const handler = (ev) => this._onDragStart(ev);
      // Find all items on the character sheet.
      html.find(".item").each((i, li) => {
        // Ignore for the header row.
        if (li.classList.contains("item-header")) return;
        // Add draggable attribute and dragstart listener.
        li.setAttribute("draggable", "true");
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  async _onResourceName(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const value = event.target?.value;
    const resourceType = $(event.currentTarget).data("rlType");
    const idx = $(event.currentTarget).parents(".item").data("rlIdx");
    const resourceList = duplicate(this.actor.data.data.tweak.resourceList);
    resourceList[idx][resourceType] = value;
    await this.actor.update({ "data.tweak.resourceList": resourceList });
  }

  async _onResourceDelete(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const idx = $(event.currentTarget).parents(".item").data("rlIdx");
    const resourceList = duplicate(this.actor.data.data.tweak.resourceList);
    resourceList.splice(idx, 1);
    await this.actor.update({ "data.tweak.resourceList": resourceList });
  }

  async _onHPMaxChange(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    //console.log("Changing HP Max" , this.actor);
    await this.actor.update({
      "data.health_max_modified": this.actor.data.data.level.value,
    });
  }

  async _onResourceCreate(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    //console.log("Changing HP Max" , this.actor);
    let resourceList = this.actor.data.data.tweak.resourceList;
    if (!resourceList) {
      resourceList = [];
    }
    resourceList.push({ name: "Resource X", value: 0, max: 1 });
    await this.actor.update({
      "data.tweak.resourceList": resourceList,
    });
  }

  async _onLoadSkills(event: JQuery.ClickEvent): Promise<unknown> {
    event.preventDefault();
    const _addSkills = async (html: HTMLElement) => {
      const form: HTMLFormElement = html[0].querySelector("form");
      const skillList = <HTMLInputElement>(
        form.querySelector('[name="skillList"]:checked')
      );
      const extra = <HTMLInputElement>(
        form.querySelector("[name=extra]:checked")
      );
      initSkills(this.actor, <"revised" | "classic" | "none">skillList.value);
      initSkills(this.actor, <"spaceMagic" | "psionic" | "none">extra.value);
      return;
    };
    const template = "systems/swnr/templates/dialogs/add-bulk-skills.html";
    const html = await renderTemplate(template, {});
    this.popUpDialog?.close();

    this.popUpDialog = new Dialog(
      {
        title: game.i18n.format("swnr.dialog.add-bulk-skills", {
          actor: this.actor.name,
        }),
        content: html,
        default: "addSkills",
        buttons: {
          addSkills: {
            label: game.i18n.localize("swnr.dialog.add-skills"),
            callback: _addSkills,
          },
        },
      },
      { classes: ["swnr"] }
    );
    return await this.popUpDialog.render(true);
  }

  async _onItemLevelUp(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = $(event.currentTarget).parents(".item");
    const item = <SWNRBaseItem>(
      this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"))
    );
    if (item.type == "skill") {
      const skill = <SWNRBaseItem<"skill">>item;
      const rank = skill.data.data.rank;
      if (rank > 0) {
        const lvl = this.actor.data.data.level.value;
        if (rank == 1 && lvl < 3) {
          ui.notifications?.error(
            "Must be at least level 3 (edit manually to override)"
          );
          return;
        } else if (rank == 2 && lvl < 6) {
          ui.notifications?.error(
            "Must be at least level 6 (edit manually to override)"
          );
          return;
        } else if (rank == 3 && lvl < 9) {
          ui.notifications?.error(
            "Must be at least level 9 (edit manually to override)"
          );
          return;
        } else if (rank > 3) {
          ui.notifications?.error("Cannot auto-level above 4");
          return;
        }
      }
      const skillCost = rank + 2;
      const isPsy =
        skill.data.data.source.toLocaleLowerCase() ===
        game.i18n.localize("swnr.skills.labels.psionic").toLocaleLowerCase()
          ? true
          : false;
      const skillPointsAvail = isPsy
        ? this.actor.data.data.unspentPsySkillPoints +
          this.actor.data.data.unspentSkillPoints
        : this.actor.data.data.unspentSkillPoints;
      if (skillCost > skillPointsAvail) {
        ui.notifications?.error(
          `Not enough skill points. Have: ${skillPointsAvail}, need: ${skillCost}`
        );
        return;
      } else if (isNaN(skillPointsAvail)) {
        ui.notifications?.error(`Skill points not set`);
        return;
      }
      await skill.update({ "data.rank": rank + 1 });
      if (isPsy) {
        const newPsySkillPoints = Math.max(
          0,
          this.actor.data.data.unspentPsySkillPoints - skillCost
        );
        let newSkillPoints = this.actor.data.data.unspentSkillPoints;
        if (skillCost > this.actor.data.data.unspentPsySkillPoints) {
          //Not enough psySkillPoints, dip into regular
          newSkillPoints -=
            skillCost - this.actor.data.data.unspentPsySkillPoints;
        }
        await this.actor.update({
          "data.unspentSkillPoints": newSkillPoints,
          "data.unspentPsySkillPoints": newPsySkillPoints,
        });
        ui.notifications?.info(
          `Removed ${skillCost} from unspent skills, with at least one psychic skill point`
        );
      } else {
        const newSkillPoints =
          this.actor.data.data.unspentSkillPoints - skillCost;
        await this.actor.update({ "data.unspentSkillPoints": newSkillPoints });
        ui.notifications?.info(`Removed ${skillCost} skill points`);
      }
    }
  }

  async _onWeaponRoll(event: JQuery.ClickEvent<HTMLElement>): Promise<void> {
    event.preventDefault();
    const itemId = event.currentTarget.parentElement.dataset.itemId;
    const weapon = <SWNRBaseItem<"weapon">>(
      this.actor.getEmbeddedDocument("Item", itemId)
    );
    return weapon.roll();
  }
  async _onSaveThrow(
    event: JQuery.ClickEvent
  ): Promise<Application | undefined> {
    event.preventDefault();
    const e = <HTMLDivElement>event.currentTarget;
    const save = e.dataset.saveType;
    if (!save) return;
    const target = <number>this.actor.data.data.save[save];
    const template = "systems/swnr/templates/dialogs/roll-save.html";
    let title = game.i18n.format("swnr.titles.savingThrow", {
      throwType: game.i18n.localize("swnr.sheet.saves." + save),
    });
    const dialogData = {};
    const html = await renderTemplate(template, dialogData);
    const _doRoll = async (html: HTMLFormElement) => {
      const rollMode = game.settings.get("core", "rollMode");
      const form = <HTMLFormElement>html[0].querySelector("form");
      const formula = `1d20cs>=(@target - @modifier)`;
      const roll = new Roll(formula, {
        modifier: parseInt(
          (<HTMLInputElement>form.querySelector('[name="modifier"]')).value
        ),
        target: target,
      });
      await roll.roll({ async: true });
      const save_text = game.i18n.format(
        parseInt(roll.result) >= 1
          ? game.i18n.localize("swnr.npc.saving.success")
          : game.i18n.localize("swnr.npc.saving.failure"),
        { actor: this.actor.name }
      );
      title += `<br><b>${save_text}</b>`;
      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker(),
          flavor: title,
        },
        { rollMode }
      );
      return roll;
    };
    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
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
    const s = this.popUpDialog.render(true);
    if (s instanceof Promise) await s;
    return this.popUpDialog;
  }
  async _onStatsRoll(event: JQuery.ClickEvent): Promise<Application> {
    event.preventDefault();

    const title = `${game.i18n.localize("swnr.chat.statRoll")}: ${
      this.actor.name
    }`;
    const template = "systems/swnr/templates/dialogs/roll-stats.html";
    const dialogData = {
      diceOptions: ["3d6", "4d6kh3"],
    };
    const html = await renderTemplate(template, dialogData);

    const _doRoll = async (html: HTMLFormElement) => {
      const rollMode = game.settings.get("core", "rollMode");
      const elements = <HTMLFormElement>html[0].querySelector("form");
      const dice = (<HTMLSelectElement>(
        elements.querySelector('[name="statpool"]')
      )).value;
      const formula = new Array(6).fill(dice).join("+");
      const roll = new Roll(formula);
      roll.roll();
      const stats: {
        [p in SWNRStats]: SWNRStatBase & SWNRStatComputed & { dice: number[] };
      } = <never>{};
      ["str", "dex", "con", "int", "wis", "cha"].map((k, i) => {
        stats[k] = {
          dice: roll.dice[i].results,
          base: roll.dice[i].total,
          boost: 0,
          mod: 0,
          bonus: 0,
          total: 0,
        };
      });
      calculateStats(stats);
      const data = {
        actor: this.actor,
        stats,
        totalMod: Object.values(stats).reduce((s, v) => {
          return s + v.mod;
        }, 0),
      };
      const chatContent = await renderTemplate(
        "systems/swnr/templates/chat/stat-block.html",
        data
      );
      const chatMessage = getDocumentClass("ChatMessage");
      chatMessage.create(
        chatMessage.applyRollMode(
          {
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            roll: JSON.stringify(roll.toJSON()),
            content: chatContent,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          },
          rollMode
        )
      );
      return roll;
    };
    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
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
    const s = this.popUpDialog.render(true);
    if (s instanceof Promise) await s;
    return this.popUpDialog;
  }
  async _onRest(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();

    const rest = async (isFrail: boolean) => {
      const data = this.actor.data.data;
      const newStrain = Math.max(data.systemStrain.value - 1, 0);
      const newHP = isFrail
        ? data.health.value
        : Math.min(data.health.value + data.level.value, data.health.max);
      await this.actor.update({
        data: {
          systemStrain: { value: newStrain },
          health: { value: newHP },
          effort: { scene: 0, day: 0 },
          tweak: {
            extraEffort: {
              scene: 0,
              day: 0,
            },
          },
        },
      });
    };

    const d = new Dialog(
      {
        title: game.i18n.localize("swnr.sheet.rest-title"),
        content: game.i18n.localize("swnr.sheet.rest-desc"),
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: "Yes",
            callback: () => rest(false),
          },
          frail: {
            icon: '<i class="fas fa-check"></i>',
            label: "Yes, but no HP",
            callback: () => rest(true),
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: "No",
          },
        },
        default: "no",
      },
      {
        classes: ["swnr"],
      }
    );
    d.render(true);
  }
  async _onHpRoll(event: JQuery.ClickEvent): Promise<void> {
    // 2e warrior/partial : +2
    // 1e psy 1d4, expert 1d6, warrior 1d8

    event.preventDefault();
    const currentLevel = this.actor.data.data.level.value;
    const lastModified = this.actor.data.data["health_max_modified"];
    if (currentLevel <= lastModified) {
      ui.notifications?.info(
        "Not rolling hp: already rolled this level (or higher)"
      );
      return;
    }
    // const lastLevel =
    // currentLevel === 1 ? 0 : this.actor.getFlag("swnr", "lastHpLevel");
    const health = this.actor.data.data.health;
    const currentHp = health.max;
    //todo: sort out health boosts from classes.
    let boosts = 0 * currentLevel;
    const constBonus = this.actor.data.data.stats.con.mod * currentLevel;
    //console.log(currentLevel, this.actor.data.data.stats.con, this.actor.data.data.stats.con.mod)

    const _rollHP = async (hpBaseInput: string) => {
      let baseRoll = "d6";
      if (hpBaseInput == "revisedWarrior") {
        baseRoll = "d6";
        boosts = 2 * currentLevel;
      } else if (hpBaseInput == "classicPsychic") {
        baseRoll = "d4";
      } else if (hpBaseInput == "classicWarrior") {
        baseRoll = "d8";
      } else if (hpBaseInput == "codexMage") {
        baseRoll = "d6";
        boosts = -1 * currentLevel;
      } else {
        baseRoll = "d6";
      }
      const formula = `${currentLevel}${baseRoll} + ${boosts} + ${constBonus}`;

      let msg = `Rolling Level ${currentLevel} HP: ${formula}<br>(Roll for level + con mod)<br>`;
      const roll = new Roll(formula).roll();
      if (roll.total) {
        let hpRoll = Math.max(roll.total, 1);
        msg += `Got a ${hpRoll}<br>`;
        if (currentLevel == 1) {
          // Rolling the first time
        } else if (currentLevel > 1) {
          hpRoll = Math.max(hpRoll, currentHp + 1);
        }
        msg += `Setting HP max to ${hpRoll}<br>`;
        await this.actor.update({
          "data.health_max_modified": currentLevel,
          "data.health_base_type": hpBaseInput,
          "data.health.max": hpRoll,
        });
        getDocumentClass("ChatMessage").create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: msg,
          roll: JSON.stringify(roll),
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        });
      } else {
        console.log("Something went wrong with roll ", roll);
      }
    };

    const _setAndRollHP = async (html: HTMLFormElement) => {
      const form: HTMLFormElement | null = html[0].querySelector("form");
      if (!form) {
        console.log("Form missing");
        return;
      }
      const hpBaseInput = <HTMLInputElement>(
        form.querySelector('[name="hpRoll"]:checked')
      );

      return _rollHP(hpBaseInput.value);
    };

    if (this.actor.data.data["health_base_type"]) {
      await _rollHP(this.actor.data.data["health_base_type"]);
    } else {
      const template = "systems/swnr/templates/dialogs/roll_hp.html";
      const html = await renderTemplate(template, {});
      this.popUpDialog?.close();

      this.popUpDialog = new Dialog(
        {
          title: game.i18n.format("swnr.dialog.hp.text", {
            actor: this.actor.name,
          }),
          content: html,
          default: "rollHP",
          buttons: {
            rollHP: {
              label: game.i18n.localize("swnr.chat.roll"),
              callback: _setAndRollHP,
            },
          },
        },
        { classes: ["swnr"] }
      );
      await this.popUpDialog.render(true);
    }

    return;
  }
  async _onSkillRoll(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    console.log(event);
    const target = <HTMLElement>event.currentTarget;
    const dataset = target.dataset;
    const skillID = dataset.itemId as string;
    const skill = <SWNRBaseItem<"skill">>(
      this.actor.getEmbeddedDocument("Item", skillID)
    );
    skill.roll();
  }
  /** @override */
  async getData(): Promise<CharacterActorSheetData> {
    let data = super.getData();
    if (data instanceof Promise) data = await data;
    return {
      ...data,
      useHomebrewLuckSave: !!game.settings.get("swnr", "useHomebrewLuckSave"),
      itemTypes: this.actor.itemTypes,
    };
  }
  /** @override */
  async _updateObject(
    event: Event,
    formData: Record<string, number | string>
  ): Promise<SWNRCharacterActor | undefined> {
    this._itemEditHandler(formData);
    super._updateObject(event, formData);
    return this.actor;
  }
  _itemEditHandler(formData: Record<string, string | number>): void {
    const itemUpdates = {};
    Object.keys(formData)
      .filter((k) => k.startsWith("items."))
      .forEach((k) => {
        const value = formData[k];
        delete formData[k];
        const broken = k.split(".");
        const id = broken[1];
        const update = broken.splice(2).join(".");
        if (!itemUpdates[id]) itemUpdates[id] = { _id: id };
        itemUpdates[id][update] = value;
      });
    for (const key in itemUpdates) {
      if (Object.prototype.hasOwnProperty.call(itemUpdates, key)) {
        const element = itemUpdates[key];
        this.actor.updateEmbeddedDocuments("Item", [element]);
      }
    }
  }

  async _onConfigureActor(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    const template = "systems/swnr/templates/dialogs/tweak-char.html";
    const data = {
      actor: this.actor,
      itemTypes: this.actor.itemTypes,
    };
    const html = await renderTemplate(template, data);
    this.popUpDialog?.close();

    const _saveTweakChar = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const advantageInit = (<HTMLInputElement>(
        form.querySelector('[name="advantageInit"]')
      ))?.checked
        ? true
        : false;
      const quickSkill1 =
        (<HTMLSelectElement>form.querySelector('[name="quickSkill1"]'))
          ?.value || null;
      const quickSkill2 =
        (<HTMLSelectElement>form.querySelector('[name="quickSkill2"]'))
          ?.value || null;
      const quickSkill3 =
        (<HTMLSelectElement>form.querySelector('[name="quickSkill3"]'))
          ?.value || null;
      const extraEffortName =
        (<HTMLInputElement>form.querySelector('[name="extraEffortName"]'))
          ?.value || "";
      const showResourceList = (<HTMLInputElement>(
        form.querySelector('[name="showResourceList"]')
      ))?.checked
        ? true
        : false;
      const update = {
        "data.tweak": {
          advInit: advantageInit,
          quickSkill1: quickSkill1,
          quickSkill2: quickSkill2,
          quickSkill3: quickSkill3,
          extraEffortName: extraEffortName,
          showResourceList: showResourceList,
        },
      };
      await this.actor.update(update);
    };
    this.popUpDialog = new Dialog(
      {
        title: game.i18n.format("swnr.dialog.tweak-char", {
          actor: this.actor.name,
        }),
        content: html,
        default: "saveChanges",
        buttons: {
          saveChanges: {
            label: game.i18n.localize("swnr.dialog.save-changes"),
            callback: _saveTweakChar,
          },
        },
      },
      { classes: ["swnr"] }
    );
    await this.popUpDialog.render(true);
  }

  /**
   * Extend and override the sheet header buttons
   * @override
   */
  _getHeaderButtons(): Application.HeaderButton[] {
    const buttons = super._getHeaderButtons();
    // Token Configuration
    const canConfigure = game.user?.isGM || this.actor.isOwner;
    if (this.options.editable && canConfigure) {
      // Insert tweaks into first spot on the array
      buttons.splice(0, 0, {
        label: game.i18n.localize("swnr.sheet.tweaks"),
        class: "configure-actor",
        icon: "fas fa-code",
        onclick: (ev) => this._onConfigureActor(ev),
      });
    }
    return buttons;
  }
}

Hooks.on(
  "renderChatMessage",
  (message: ChatMessage, html: JQuery, user: User) => {
    const statApplyButton = <JQuery<HTMLButtonElement>>(
      html.find(".statApplyButton button")
    );
    if (statApplyButton.length !== 0) {
      // fix later
      const actorId = message.data["speaker"]["actor"];
      if (!actorId) throw new Error("no id");
      const actor = game.actors?.get(actorId);
      if (!actor) throw new Error("missing actor?");

      if (
        message.getFlag("swnr", "alreadyDone") ||
        (!game.user?.isGM && game.user?.id === user.id)
      ) {
        statApplyButton.prop("disabled", true);
      } else {
        const bind = function (event: JQuery.ClickEvent) {
          event.preventDefault();
          message.setFlag("swnr", "alreadyDone", true);
          statApplyButton.prop("disabled", true);
          const messageContent = statApplyButton.parents(".message-content");
          const stats = {};
          ["str", "dex", "con", "int", "wis", "cha"].forEach((stat) => {
            stats[stat] = {
              base: parseInt(
                messageContent.find(`.stat-${stat} .statBase`).text()
              ),
            };
          });
          actor.update({ data: { stats } });
        };
        statApplyButton.one("click", bind);
      }
    }
  }
);
export const sheet = CharacterActorSheet;
export const types = ["character"];
