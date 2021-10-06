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
}

export const document = SWNRDroneActor;
export const name = "drone";
