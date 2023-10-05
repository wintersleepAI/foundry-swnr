import { SWNRBaseActor } from "../base-actor";

export class SWNRCyberdeckActor extends SWNRBaseActor<"cyberdeck"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    //TODO
  }
}

export const document = SWNRCyberdeckActor;
export const name = "cyberdeck";
