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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async _preCreate(actorDataConstructorData, options, user): Promise<void> {
    await super._preCreate(actorDataConstructorData, options, user);
    if (
      actorDataConstructorData.type &&
      this.data._source.img == "icons/svg/mystery-man.svg"
    ) {
      const img = "systems/swnr/assets/icons/cyberdeck.png";
      this.data._source.img = img;
    }
  }
}

export const document = SWNRCyberdeckActor;
export const name = "cyberdeck";
