import { SWNRBaseActor } from "../base-actor";

export class SWNRVehicleActor extends SWNRBaseActor<"vehicle"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    const mass = data.mass.max;
    const power = data.power.max;
    const hardpoints = data.hardpoints.max;
    //TODO
    data.power.value = mass;
    data.mass.value = power;
    data.hardpoints.value = hardpoints;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async _preCreate(actorDataConstructorData, options, user): Promise<void> {
    await super._preCreate(actorDataConstructorData, options, user);
    if (
      actorDataConstructorData.type &&
      this.data._source.img == "icons/svg/mystery-man.svg"
    ) {
      const mechImg = "systems/swnr/assets/icons/vehicle.png";
      this.data._source.img = mechImg;
    }
  }

  addCrew(actorId: string): void {
    const actor = game.actors?.get(actorId);
    if (actor) {
      const crewMembers = this.data.data.crewMembers;
      //Only add crew once
      if (crewMembers.indexOf(actorId) == -1) {
        let crew = this.data.data.crew.current;
        crew += 1;
        crewMembers.push(actorId);
        this.update({
          "data.crew.current": crew,
          "data.crewMembers": crewMembers,
        });
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
}

export const document = SWNRVehicleActor;
export const name = "vehicle";
