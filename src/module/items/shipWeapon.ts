import { SWNRBaseItem } from "../base-item";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRCharacterActor } from "../actors/character";
import { SWNRNPCActor } from "../actors/npc";

export class SWNRShipWeapon extends SWNRBaseItem<"weapon"> {
  popUpDialog?: Dialog;
  async roll(): Promise<void> {
    ui.notifications?.info("rolling");
    if (!this.actor) {
      const message = `Called ship weapon.roll on item without an actor.`;
      ui.notifications?.error(message);
      new Error(message);
      return;
    }
    if (this.actor.type=="ship"){
      let defaultGunner = this.actor.data.data.roles.gunnery;
      let crewArray: Array<SWNRCharacterActor| SWNRNPCActor> = [];
      if (this.actor.data.data.crewMembers) {
        for (var i in this.actor.data.data.crewMembers ){
          let cId = this.actor.data.data.crewMembers[i];
          let crewMember=game.actors?.get(cId);
          if (crewMember && (crewMember.type=="character" || crewMember.type=="npc")){
            crewArray.push(crewMember);
          }  
        }
      }
      
      
    }
  }
}

export const document = SWNRShipWeapon;
export const name = "shipWeapon";
