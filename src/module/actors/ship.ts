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
    let crewArray=  data.crewMembers.map(actorId => game.actors?.get(actorId));
    if (!data["crewArray"]) {
      data["crewArray"] = crewArray;
    }
    console.log(crewArray);
  }

  addCrew(actorId: string): void {
    let actor = game.actors?.get(actorId);
    if (actor){
      let crewMembers = this.data.data.crewMembers;
      //Only add crew once
      if (crewMembers.indexOf(actorId) == -1){
        let crew = this.data.data.crew.current;
        crew += 1;
        crewMembers.push(actorId);
        this.update({"data.crew.current": crew, "data.crewMembers": crewMembers});
        console.log(this.data.data.crewMembers);
      }

    } else {
      ui.notifications?.error("Actor added no longer exists");
    }
  }
  // _preCreatedata(actorDataConstructorData, options, user):
  //  void {
  //   // super._preCreate(actorDataConstructorData, options, user);
  //   // console.log("testing precreate");
  //   // const shipImg= "systems/swnr/assets/icons/spaceship.svg"; 
  //   // actorDataConstructorData.data.img = shipImg;
  //   // actorDataConstructorData.data.token.img = shipImg;
  // }
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
