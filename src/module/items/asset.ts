import { SWNRFactionActor } from "../actors/faction";
import { ValidatedDialog } from "../ValidatedDialog";
import { AssetType } from "../item-types";
import { SWNRBaseItem } from "./../base-item";

export class SWNRFactionAsset extends SWNRBaseItem<"asset"> {
  popUpDialog?: Dialog;

  async _attack(isOffense: boolean): Promise<void> {
    const data = this.data.data;
    let hitBonus = 0;
    const damage = isOffense ? data.attackDamage : data.counter;
    if (!damage) {
      ui.notifications?.info("No damage to roll for asset");
      return;
    }
    const attackType = isOffense ? data.attackSource : data.assetType;
    if (!this.actor) {
      ui.notifications?.error("Asset must be associated with a faction");
      return;
    }
    if (this.actor.type != "faction") {
      ui.notifications?.error("Asset must be associated with a faction");
      return;
    }
    const actor: SWNRFactionActor = this.actor;
    if (attackType) {
      if (attackType === "cunning") {
        hitBonus = actor.data.data.cunningRating;
      } else if (attackType === "force") {
        hitBonus = actor.data.data.forceRating;
      } else if (attackType === "wealth") {
        hitBonus = actor.data.data.wealthRating;
      }
    }
    const rollData = {
      hitBonus,
    };
    const attackKey = isOffense
      ? "swnr.sheet.faction.attack-roll"
      : "swnr.sheet.faction.counter-roll";
    const hitRollStr = "1d10 + @hitBonus";
    const hitRoll = new Roll(hitRollStr, rollData).roll();
    const damageDice = isOffense ? data.attackDamage : data.counter;
    const damageRoll = new Roll(damageDice, rollData).roll();
    const diceData = Roll.fromTerms([
      PoolTerm.fromRolls([hitRoll, damageRoll]),
    ]);
    const dialogData = {
      desc: this.data.data.description,
      name: `${this.actor.name} - ${this.name}`,
      hitRoll: await hitRoll.render(),
      damageRoll: await damageRoll.render(),
      attackKey: game.i18n.localize(attackKey),
    };
    const template = "systems/swnr/templates/chat/asset-attack.html";
    const chatContent = await renderTemplate(template, dialogData);
    const chatData = {
      roll: JSON.stringify(diceData),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    getDocumentClass("ChatMessage").applyRollMode(chatData, "gmroll");
    getDocumentClass("ChatMessage").create(chatData);
  }

  // Search other factions for attack targets with targetType
  async _search(targetType: AssetType | ""): Promise<void> {
    if (!targetType) {
      ui.notifications?.info(
        "Attacking asset has no target type (cunning/wealth/force)"
      );
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const otherActiveFactions: any[] | undefined = game.actors?.filter(
      (i) =>
        i.type === "faction" &&
        i.data.data.active == true &&
        this.actor?.id != i.id
    );
    if (!otherActiveFactions || otherActiveFactions.length == 0) {
      ui.notifications?.info("No other active factions found");
      return;
    }
    // id - > [faction, array of targets]
    const targetFactions: Record<
      string,
      [SWNRFactionActor, SWNRBaseItem<"asset">[]]
    > = {};
    // id -> name
    const factionIdNames: Record<string, string | null> = {};
    for (const f of otherActiveFactions) {
      const fA = <SWNRFactionActor>f;
      if (targetType === "cunning") {
        if (fA.id && fA.data.data.cunningAssets.length > 0) {
          targetFactions[fA.id] = [fA, fA.data.data.cunningAssets];
          factionIdNames[fA.id] = fA.name;
        }
      } else if (targetType === "force") {
        if (fA.id && fA.data.data.forceAssets.length > 0) {
          targetFactions[fA.id] = [fA, fA.data.data.forceAssets];
          factionIdNames[fA.id] = fA.name;
        }
      } else if (targetType === "wealth") {
        if (fA.id && fA.data.data.wealthAssets.length > 0) {
          targetFactions[fA.id] = [fA, fA.data.data.wealthAssets];
          factionIdNames[fA.id] = fA.name;
        }
      }
    }
    if (Object.keys(targetFactions).length == 0) {
      ui.notifications?.info(
        `${otherActiveFactions.length} other active factions found, but no ${targetType} assets were found`
      );
      return;
    }
    const dialogData = {
      faction: this.actor,
      attackingAsset: this,
      targetFactionsIdNames: factionIdNames,
      targets: targetFactions,
    };
    const template = "systems/swnr/templates/dialogs/select-asset-target.html";
    const html = renderTemplate(template, dialogData);

    const _rollForm = async (html: HTMLFormElement) => {
      ui.notifications?.info("here");
    };

    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: `Select asset to attack for ${this.name}`,
        content: await html,
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.localize("swnr.sheet.faction.attack"),
            callback: _rollForm,
          },
        },
      },
      {
        classes: ["swnr"],
      }
    );
    this.popUpDialog.render(true);
  }

  async roll(): Promise<void> {
    const data = this.data.data;
    if (data.attackDamage && data.attackDamage !== "") {
      const d = new Dialog({
        title: "Attack with Asset",
        content:
          "<p>Do you want to roll an attack(default), counter, or search for an asset to attack?</p>",
        buttons: {
          attack: {
            icon: '<i class="fas fa-check"></i>',
            label: "Attack",
            callback: () => this._attack(true),
          },
          counter: {
            icon: '<i class="fas fa-check"></i>',
            label: "Counter",
            callback: () => this._attack(false),
          },
          search: {
            icon: '<i class="fas fa-check"></i>',
            label: "Search active factions for an asset to attack",
            callback: () => this._search(data.attackTarget),
          },
        },
        default: "attack",
      });
      d.render(true);
    } else {
      // Basic template rendering data
      let content = `<h3> ${this.name} </h3>`;
      if ("description" in data) {
        content += `<span class="flavor-text"> ${data.description}</span>`;
      } else {
        content += "<span class='flavor-text'> No Description</span>";
      }

      ChatMessage.create({
        //speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: content, //${item.data.description}
        //type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      });
    }
  }
}

export const document = SWNRFactionAsset;
export const name = "asset";
