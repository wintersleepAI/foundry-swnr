import { DocumentModificationOptions } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs";
import { SWNRBaseActor } from "../base-actor";
import { DRONE_MODEL_DATA } from "./vehicle-hull-base";
import { SWNRBaseItem } from "../base-item";

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
    const shipInventory = <SWNRBaseItem<"shipDefense" | "shipFitting">[]>(
      this.items.filter(
        (i) => i.type === "shipDefense" || i.type === "shipFitting"
      )
    );
    const shipWeaponInventory = <SWNRBaseItem<"shipWeapon">[]>(
      this.items.filter((i) => i.type === "shipWeapon")
    );
    const weaponInventory = <SWNRBaseItem<"weapon">[]>(
      this.items.filter((i) => i.type === "weapon")
    );
    let totalMass = shipInventory
      .map((i) => i.data.data.mass)
      .reduce((i, n) => i + n, 0);
    const totalWeaponMass = shipWeaponInventory
      .map((i) => i.data.data.mass)
      .reduce((i, n) => i + n, 0);
    //CWN has hardpoints. Caclulate max hardpoints based on item count
    if (data.hardpoints.max > 0) {
      data.hardpoints.value =
        data.hardpoints.max -
        shipWeaponInventory.length -
        weaponInventory.length;
    } else {
      totalMass += totalWeaponMass;
      data.hardpoints.value = 0;
    }
    data.fittings.value -= totalMass;
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
            type: "drone",
          },
        };
      }
    });
    return super.createEmbeddedDocuments(itemType, itemArray, options);
  }

  async addCrew(actorId: string): Promise<void> {
    const actor = game.actors?.get(actorId);
    if (actor) {
      const crewMembers = this.data.data.crewMembers;
      //Only add crew once
      if (crewMembers.indexOf(actorId) == -1) {
        //only one crew member allowed
        if (crewMembers.length == 1) {
          // Swap
          crewMembers[0] = actorId;
          await this.update({
            "data.crewMembers": crewMembers,
          });
        } else {
          // No crew member
          let crew = this.data.data.crew.current;
          crew += 1;
          crewMembers.push(actorId);
          await this.update({
            "data.crew.current": crew,
            "data.crewMembers": crewMembers,
          });
        }
        const itemName = this.name + " " + this.data.data.model;
        actor.createEmbeddedDocuments(
          "Item",
          [
            {
              name: itemName,
              type: "item",
              img: "systems/swnr/assets/icons/drone.png",
              data: {
                encumbrance: this.data.data.enc,
              },
            },
          ],
          {}
        );
        ui.notifications?.info(
          `Created an item "${itemName}" on ${actor.name}'s sheet`
        );
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

  async applyDefaulStats(modelType: string): Promise<void> {
    if (DRONE_MODEL_DATA[modelType]) {
      await this.update(DRONE_MODEL_DATA[modelType]);
    } else {
      console.log("drone model type not found " + modelType);
    }
  }

  async _onCreate(): Promise<void> {
    await this.update({
      "token.actorLink": false,
      img: "systems/swnr/assets/icons/drone.png",
    });
  }
}

export const document = SWNRDroneActor;
export const name = "drone";
