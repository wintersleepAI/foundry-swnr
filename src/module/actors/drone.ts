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
