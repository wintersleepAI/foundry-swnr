import { DocumentModificationOptions } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs";
import { Options } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/roll";
import { SWNRBaseActor } from "../base-actor";

export class SWNRDroneActor extends SWNRBaseActor<"drone"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    //TODO
    data.fittings.value = data.fittings.max;
  }

  // Convert weapons to shipWeapons to use same weapon rolling interface
  async createEmbeddedDocuments(
    itemType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemArray: Array<Record<any, any>>,
    options: DocumentModificationOptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Array<foundry.abstract.Document<any, any>>> {
    itemArray = itemArray.map((i) => {
      if (i.type !== "weapon") {
        return i;
      } else {
        return {
          name: i.name,
          type: "shipWeapon",
          data: {
            mass: 1,
            cost: i.data.cost,
            power: 0,
            ammo: i.data.ammo,
            damage: i.data.damage,
          },
        };
      }
    });
    return super.createEmbeddedDocuments(itemType, itemArray, options);
  }

  addCrew(actorId: string): void {
    const actor = game.actors?.get(actorId);
    if (actor) {
      const crewMembers = this.data.data.crewMembers;
      //Only add crew once
      if (crewMembers.indexOf(actorId) == -1) {
        //only one crew member allowed
        if (crewMembers.length == 1) {
          // Swap
          crewMembers[0] = actorId;
          this.update({
            "data.crewMembers": crewMembers,
          });
        } else {
          // No crew member
          let crew = this.data.data.crew.current;
          crew += 1;
          crewMembers.push(actorId);
          this.update({
            "data.crew.current": crew,
            "data.crewMembers": crewMembers,
          });
        }
      }
    } else {
      ui.notifications?.error("Actor added no longer exists");
    }
  }

  removeCrew(actorId: string): void {
    const crewMembers = this.data.data.crewMembers;
    //Only remove if there
    const idx = crewMembers.indexOf(actorId);
    if (idx == -1) {
      ui.notifications?.error("Crew member not found");
    } else {
      crewMembers.splice(idx, 1);
      let crew = this.data.data.crew.current;
      crew -= 1;
      this.update({
        "data.crew.current": crew,
        "data.crewMembers": crewMembers,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async _preCreate(actorDataConstructorData, options, user): Promise<void> {
    await super._preCreate(actorDataConstructorData, options, user);
    if (
      actorDataConstructorData.type &&
      this.data._source.img == "icons/svg/mystery-man.svg"
    ) {
      const mechImg = "systems/swnr/assets/icons/drone.png";
      this.data._source.img = mechImg;
    }
  }
}

export const document = SWNRDroneActor;
export const name = "drone";
