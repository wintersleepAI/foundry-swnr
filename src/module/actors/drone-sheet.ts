import { SWNRDroneActor } from "./drone";

interface DroneActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRDroneActor["itemTypes"];
}

export class DroneActorSheet extends ActorSheet<
  ActorSheet.Options,
  DroneActorSheetData
> {
  popUpDialog?: Dialog;
  object: SWNRDroneActor;

  get actor(): SWNRDroneActor {
    if (super.actor.type != "drone") throw Error;
    return super.actor;
  }
}

export const sheet = DroneActorSheet;
export const types = ["drone"];
