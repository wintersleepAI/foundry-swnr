import { SWNRBaseActor } from "../base-actor";
import { HULL_DATA } from "./ship-hull-base";

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

  applyDefaulStats(hullType: string) {
    console.log("Applying hullType :" +hullType);
    if (HULL_DATA[hullType]) {
      this.update(HULL_DATA[hullType]
      );
    } else {
      console.log("hull type not found " + hullType);
    }
  }

  async useDaysOfLifeSupport(nDays: number){
    if (this.data.data.crew.current > 0) {
      let newLifeDays = this.data.data.lifeSupportDays.value;
      newLifeDays-= (this.data.data.crew.current * nDays);
      this.update({
        "data.lifeSupportDays.value":newLifeDays
      });
      if (newLifeDays <= 0) {
        ui.notifications?.error("Out of life support!!!");
      }
    }
  }

  async rollSpike(pilotId, pilotName, skillMod, statMod, mod, dice, difficulty, travelDays) {
    const template = "systems/swnr/templates/chat/spike-roll.html";
    const rollData = {
      dice,
      skillMod,
      statMod,
      mod
    };
    const skillRollStr = `${dice} + @skillMod + @statMod + @mod`;
    const skillRoll = new Roll(
      skillRollStr,
      rollData
    ).roll();
    
    const pass = (skillRoll.total && skillRoll.total > difficulty) ? true : false;
    let failRoll: string | null = null;
    let failText: string | null = null;
    if (!pass) {
      const failRoll = new Roll("3d6").roll();
      switch (failRoll.total) {
        case 3:
          const fRoll = new Roll("1d6").roll().total;
          failText = game.i18n.localize("swnr.chat.spike.fail3");
          failText += `<br> Rolled: {fRoll}`;
          // Break all systems and drive
          break;
        case 4:
        case 5:
          failText = game.i18n.localize("swnr.chat.spike.fail4-5");
          // 50% each breaks. if engine breaks 1d6 hexes away and fail3
          break;
        case 6:
        case 7:
        case 8:
          failText = game.i18n.localize("swnr.chat.spike.fail6-8");
          // one random breaks. if engine breaks 1d6 hexes away and fail3
          break;
        case 9:
        case 10:
        case 11:
        case 12:
          failText = game.i18n.localize("swnr.chat.spike.fail9-12");
          break;
        case 13:
        case 14:
        case 15:
          travelDays = 0;
          failText = game.i18n.localize("swnr.chat.spike.fail13-15");
          break;
        case 16:
        case 17:
          travelDays*=2;
          failText = game.i18n.localize("swnr.chat.spike.fail16-17");
          break;
        case 18:
          failText = game.i18n.localize("swnr.chat.spike.fail18");
          break;
      }
    }


    const dialogData= {
      skillRoll: await skillRoll.render(),
      skillRollStr,
      travelDays,
      pass,
      failRoll,
      failText,
      pilotName,
    };
    const rollMode = game.settings.get("core", "rollMode");
    let poolRolls = [skillRoll];
    if (failRoll){
      poolRolls.push(failRoll);
    }
    const diceData = Roll.fromTerms([
      PoolTerm.fromRolls(poolRolls),
    ]);
    const chatContent = await renderTemplate(template, dialogData);
    console.log(pilotName);
    const chatData = {
      speaker: { "alias": pilotName} ,
      roll: JSON.stringify(diceData),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };

    getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
    getDocumentClass("ChatMessage").create(chatData);

    this.useDaysOfLifeSupport(travelDays);
    if (travelDays>0) { 
      let fuel = this.data.data.fuel.value;
      fuel-= 1;
      this.update({"data.fuel.value":fuel});
      if (fuel <= 0) {
        ui.notifications?.info("Out of fuel...");
      }
    }
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
      }
    } else {
      ui.notifications?.error("Actor added no longer exists");
    }
  }

  removeCrew(actorId: string): void {
    let crewMembers = this.data.data.crewMembers;
    //Only remove if there
    let idx = crewMembers.indexOf(actorId); 
    if (idx == -1){
      ui.notifications?.error("Crew member not found");

    } else {
      crewMembers.splice(idx, 1);
      let crew = this.data.data.crew.current;
      crew -= 1;
      this.update({"data.crew.current": crew, "data.crewMembers": crewMembers});
    }
    if (this.data.data.roles) {
      let roles = this.data.data.roles;
      if (roles.captain==actorId){
        roles.captain = "";
      }
      if (roles.comms==actorId){
        roles.comms = "";
      }
      if (roles.engineering==actorId){
        roles.engineering = "";
      }
      if (roles.gunnery==actorId){
        roles.gunnery = "";
      }
      if (roles.bridge==actorId){
        roles.bridge = "";
      }
      this.update({"data.roles": roles});
    }
  }

  async _preCreate(actorDataConstructorData, options, user):
   Promise<void> {
     await super._preCreate(actorDataConstructorData, options, user);
     if (actorDataConstructorData.type && this.data._source.img == "icons/svg/mystery-man.svg"){
      const shipImg= "systems/swnr/assets/icons/starfighter.png"; 
      this.data._source.img= shipImg;
     }
    // console.log("testing precreate");
    // const shipImg= "systems/swnr/assets/icons/spaceship.svg"; 
    // actorDataConstructorData.data.img = shipImg;
    // actorDataConstructorData.data.token.img = shipImg;
  }


  public hullData = {
    "shuttle": {

    }  
  };

}

// Hooks.on("createActor", (actorData: Actor) => {
//   if (actorData.type == "ship") {
//       const shipImg= "systems/swnr/assets/icons/spaceship.png"; 
//       //actorData.data.img = shipImg;
//       //actorData.data.token.img = shipImg;
//       if(actorData.img=="icons/svg/mystery-man.svg"){
//         actorData.update({"img": shipImg, "token.img":shipImg});
//       }
//       //actorData.data.
//   }
// });


export const document = SWNRShipActor;
export const name = "ship";
