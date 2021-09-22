import { SWNRBaseItem } from "../base-item";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRCharacterActor } from "../actors/character";
import { SWNRNPCActor } from "../actors/npc";
import { SWNRBaseActor } from "../base-actor";

export class SWNRShipWeapon extends SWNRBaseItem<"shipWeapon"> {
  popUpDialog?: Dialog;


  async rollAttack(shooterId: string | null, shooterName: string| null,
    skillMod: number, 
    statMod: number, 
    abMod: number, 
    mod: number) {
    const template = "systems/swnr/templates/chat/attack-roll.html";

    const rollData = {
      skillMod, 
      statMod,
      abMod,
      mod
    };
    const hitRollStr = "1d20 + @skillMod + @statMod + @abMod + @mod";
    const damageRollStr = `${this.data.data.damage} + @statMod`;
    const hitRoll = new Roll(
      hitRollStr,
      rollData
    ).roll();
    const damageRoll = new Roll(
      damageRollStr,
       rollData
    ).roll();

    const diceTooltip = {
      hit: await hitRoll.render(),
      damage: await damageRoll.render(),
      hitExplain: hitRollStr,
      damageExplain: damageRollStr,
    };

    const dialogData = {
      weapon: this,
      hitRoll,
      damageRoll,
      diceTooltip
    };

    const rollMode = game.settings.get("core", "rollMode");
    // const dice = hitRoll.dice.concat(damageRoll.dice)
    // const formula = dice.map(d => (<any>d).formula).join(' + ');
    // const results = dice.reduce((a, b) => a.concat(b.results), [])
    const diceData = Roll.fromTerms([
      PoolTerm.fromRolls([hitRoll, damageRoll]),
    ]);
    const chatContent = await renderTemplate(template, dialogData);
    const chatData = {
      speaker: { "alias": shooterName} ,
      roll: JSON.stringify(diceData),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
    getDocumentClass("ChatMessage").create(chatData);
  }

  async roll(): Promise<void> {
    if (!this.actor) {
      const message = `Called ship weapon.roll on item without an actor.`;
      ui.notifications?.error(message);
      new Error(message);
      return;
    }
    if (this.data.data.broken) {
      ui.notifications?.error("Weapon is broken. Cannot fire!");
      return;
    }
    if (this.actor.type == "ship") {
      let defaultGunnerId: string | null = this.actor.data.data.roles.gunnery;
      let defaultGunner: SWNRCharacterActor | SWNRNPCActor | null = null;
      if (defaultGunnerId) {
        let _temp = game.actors?.get(defaultGunnerId);
        if (_temp && (_temp.type == "character" || _temp.type == "npc")) {
          defaultGunner = _temp;
        }
      }
      let crewArray: Array<SWNRCharacterActor | SWNRNPCActor> = [];
      if (this.actor.data.data.crewMembers) {
        for (var i in this.actor.data.data.crewMembers) {
          let cId = this.actor.data.data.crewMembers[i];
          let crewMember = game.actors?.get(cId);
          if (crewMember && (crewMember.type == "character" || crewMember.type == "npc")) {
            crewArray.push(crewMember);
          }
        }
      }

      const title = game.i18n.format("swnr.dialog.attackRoll", {
        actorName: this.actor?.name,
        weaponName: this.name,
      });

      if (defaultGunner == null && crewArray.length > 0) {
        //There is no gunner. Use first crew as default
        defaultGunner = crewArray[0];
        defaultGunnerId = crewArray[0].id;
      }
      if (defaultGunner?.type == "npc" && crewArray.length > 0) {
        //See if we have a non NPC to set as gunner to get skills and attr
        for (let char of crewArray) {
          if (char.type == "character") {
            defaultGunner = char;
            defaultGunnerId = char.id;
            break;
          }
        }
      }

      const dialogData = {
        actor: this.actor.data,
        weapon: this.data.data,
        defaultSkill1: "Shoot",
        defaultSkill2: "Combat/Gunnery",
        defaultStat: "int",
        gunner: defaultGunner,
        gunnerId: defaultGunnerId,
        crewArray: crewArray,
      };

      const template = "systems/swnr/templates/dialogs/roll-ship-attack.html";
      const html = await renderTemplate(template, dialogData);

      const _rollForm = async (html: HTMLFormElement) => {
        const form = <HTMLFormElement>html[0].querySelector("form");
        const mod = parseInt(
          (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
        );

        const shooterId = (<HTMLInputElement>form.querySelector('[name="shooterId"]'))?.value
        const shooter = shooterId ? game.actors?.get(shooterId) : null;
        // const dice = (<HTMLSelectElement>form.querySelector('[name="dicepool"]'))
        //   .value;
        const skillName =
          (<HTMLSelectElement>form.querySelector('[name="skill"]'))?.value;
        const statName =
          (<HTMLSelectElement>form.querySelector('[name="stat"]'))?.value;

        let skillMod = 0;
        let statMod = 0;
        let abMod = 0;
        let shooterName: string | null = "";
        if (shooter) {
          if (skillName) {
            // We need to look up by name
            for (let skill of shooter.itemTypes.skill) {
              if (skillName == skill.data.name) {
                skillMod = skill.data.data["rank"] < 0 ? -2 : skill.data.data["rank"];
              }
            }
          }//end skill
          if (statName) {
            let sm = shooter.data.data["stats"]?.[statName].mod;
            if (sm) {
              console.log("setting stat mod", sm);
              statMod = sm;
            }
          }
          if (shooter.type == "character") {
            abMod = shooter.data.data.ab;
          }
          shooterName = shooter.name;
        }
        this.rollAttack(shooterId, shooterName, skillMod, statMod, abMod, mod);
      }

      this.popUpDialog?.close();
      this.popUpDialog = new ValidatedDialog(
        {
          title: title,
          content: html,
          default: "roll",
          buttons: {
            roll: {
              label: game.i18n.localize("swnr.chat.roll"),
              callback: _rollForm,
            },
          },
        },
        {
          classes: ["swnr"],
        }
      );
      const s = this.popUpDialog.render(true);
    }
  }
}

export const document = SWNRShipWeapon;
export const name = "shipWeapon";
