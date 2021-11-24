import { SWNRBaseActor } from "../base-actor";
import { SWNRBaseItem } from "../base-item";

export class SWNRFactionActor extends SWNRBaseActor<"faction"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }
}

export const document = SWNRFactionActor;
export const name = "faction";
