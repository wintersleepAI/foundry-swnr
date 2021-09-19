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

  _preCreatedata(actorDataConstructorData, options, user):
   void {
    // super._preCreate(actorDataConstructorData, options, user);
    // console.log("testing precreate");
    // const shipImg= "systems/swnr/assets/icons/spaceship.svg"; 
    // actorDataConstructorData.data.img = shipImg;
    // actorDataConstructorData.data.token.img = shipImg;
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
