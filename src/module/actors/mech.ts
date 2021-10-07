import { SWNRBaseActor } from "../base-actor";
import { SWNRBaseItem } from "../base-item";

export class SWNRMechActor extends SWNRBaseActor<"mech"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    const mechClass = data.mechClass;
    let mechMass = data.mass.max;
    let mechPower = data.power.max;
    let mechHardpoint = data.hardpoints.max;

    let multiplier = 1;
    if (mechClass == "light") {
      multiplier = 2;
    } else if (mechClass == "heavy") {
      multiplier = 4;
    }

    const mechInventory = <
      SWNRBaseItem<"shipDefense" | "shipWeapon" | "shipFitting">[]
    >this.items.filter(
      (i) =>
        i.type === "shipDefense" ||
        i.type === "shipWeapon" ||
        i.type === "shipFitting"
    );

    for (let i = 0; i < mechInventory.length; i++) {
      const item = mechInventory[i];
      let itemMass = item.data.data.mass;
      let itemPower = item.data.data.power;
      if (item.data.data.massMultiplier) {
        itemMass *= multiplier;
      }
      if (item.data.data.powerMultiplier) {
        itemPower *= multiplier;
      }
      mechMass -= itemMass;
      mechPower -= itemPower;
      if (item.type == "shipWeapon") {
        const itemHardpoint = item.data.data["hardpoint"];
        if (itemHardpoint) {
          mechHardpoint -= itemHardpoint;
        }
      }
    }
    data.power.value = mechPower;
    data.mass.value = mechMass;
    data.hardpoints.value = mechHardpoint;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async _preCreate(actorDataConstructorData, options, user): Promise<void> {
    await super._preCreate(actorDataConstructorData, options, user);
    if (
      actorDataConstructorData.type &&
      this.data._source.img == "icons/svg/mystery-man.svg"
    ) {
      const mechImg = "systems/swnr/assets/icons/mech.png";
      this.data._source.img = mechImg;
    }
  }
}

export const document = SWNRMechActor;
export const name = "mech";
