import { SWNRBaseActor } from "../base-actor";
import { SWNRBaseItem } from "../base-item";

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
    const shipInventory = <
      SWNRBaseItem<"shipDefense" | "shipWeapon" | "shipFitting">[]
    >this.items.filter(
      (i) =>
        i.type === "shipDefense" ||
        i.type === "shipWeapon" ||
        i.type === "shipFitting"
    );
    const totalMass = shipInventory
      .map((i) => i.data.data.mass)
      .reduce((i, n) => i + n, 0);
    const totalPower = shipInventory
      .map((i) => i.data.data.power)
      .reduce((i, n) => i + n, 0);
    const totalHardpoint = shipInventory
      .filter((i) => i.type === "shipWeapon")
      .map((i) => i.data.data["hardpoint"])
      .reduce((i, n) => i + n, 0);
    data.power.value = mass - totalMass;
    data.mass.value = power - totalPower;
    data.hardpoints.value = hardpoints - totalHardpoint;
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
