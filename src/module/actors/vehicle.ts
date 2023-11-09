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
    data.mass.value = mass - totalMass;
    data.power.value = power - totalPower;
    data.hardpoints.value = hardpoints - totalHardpoint;
  }

  async addCrew(actorId: string): Promise<void> {
    const actor = game.actors?.get(actorId);
    if (actor) {
      const crewMembers = this.data.data.crewMembers;
      //Only add crew once
      if (crewMembers.indexOf(actorId) == -1) {
        let crew = this.data.data.crew.current;
        crew += 1;
        crewMembers.push(actorId);
        await this.update({
          "data.crew.current": crew,
          "data.crewMembers": crewMembers,
        });
      }
    } else {
      ui.notifications?.error("Actor added no longer exists");
    }
  }

  async removeCrew(actorId: string): Promise<void> {
    const crewMembers = this.data.data.crewMembers;
    //Only remove if there
    const idx = crewMembers.indexOf(actorId);
    if (idx == -1) {
      ui.notifications?.error("Crew member not found");
    } else {
      crewMembers.splice(idx, 1);
      let crew = this.data.data.crew.current;
      crew -= 1;
      await this.update({
        "data.crew.current": crew,
        "data.crewMembers": crewMembers,
      });
    }
  }

  async _onCreate(): Promise<void> {
    await this.update({
      "token.actorLink": true,
      img: "systems/swnr/assets/icons/vehicle.png",
    });
  }
}

export const document = SWNRVehicleActor;
export const name = "vehicle";
