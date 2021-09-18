import { SWNRBaseActor } from "../base-actor";

export class SWNRShipActor extends SWNRBaseActor<"ship"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  prepareBaseData(): void {
    const data = this.data.data;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
  }
}

Hooks.on("createActor", (actorData: Actor) => {
  if (actorData.type == "ship") {
      const shipImg= "systems/swnr/assets/icons/spaceship.svg"; 
      actorData.data.img = shipImg;
      actorData.data.token.img = shipImg;
  }
});


export const document = SWNRShipActor;
export const name = "ship";
