import { SWNRBaseItem } from "../base-item";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRCharacterActor } from "../actors/character";
import { SWNRNPCActor } from "../actors/npc";

export class SWNRShipWeapon extends SWNRBaseItem<"shipWeapon"> {
  popUpDialog?: Dialog;
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
    if (this.actor.type=="ship"){
      let defaultGunnerId: string | null = this.actor.data.data.roles.gunnery;
      console.log(defaultGunnerId);
      let defaultGunner: SWNRCharacterActor| SWNRNPCActor | null = null;

      let crewArray: Array<SWNRCharacterActor| SWNRNPCActor> = [];
      if (this.actor.data.data.crewMembers) {
        for (var i in this.actor.data.data.crewMembers ){
          let cId = this.actor.data.data.crewMembers[i];
          let crewMember=game.actors?.get(cId);
          if (crewMember && (crewMember.type=="character" || crewMember.type=="npc")){
            crewArray.push(crewMember);
            if (defaultGunnerId == cId) {
              console.log("Setting gunner", defaultGunnerId, cId);
              defaultGunner == await crewMember.clone();
              console.log(defaultGunner);
            }
          }  
        }
      }

      const title = game.i18n.format("swnr.dialog.attackRoll", {
        actorName: this.actor?.name,
        weaponName: this.name,
      });
      
      if (defaultGunner == null && crewArray.length>0){
        //There is no gunner. Use first crew as default
        console.log("changing", defaultGunner);
        defaultGunner=crewArray[0];
        defaultGunnerId = crewArray[0].id;
      } 
      console.log(crewArray);
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
        const modifier = parseInt(
          (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
        );
        console.log("Submitted");
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
          failCallback: (): void => {
            ui.notifications?.error(game.i18n.localize("swnr.roll.skillNeeded"));
          },
          classes: ["swnr"],
        }
      );
      const s = this.popUpDialog.render(true);
    }
  }
}

export const document = SWNRShipWeapon;
export const name = "shipWeapon";
