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
  }
}

export const document = SWNRVehicleActor;
export const name = "vehicle";
