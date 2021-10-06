import { SWNRVehicleActor } from "./vehicle";

interface VehicleActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRVehicleActor["itemTypes"];
}

export class VehicleActorSheet extends ActorSheet<
  ActorSheet.Options,
  VehicleActorSheetData
> {
  popUpDialog?: Dialog;
  object: SWNRVehicleActor;

  get actor(): SWNRVehicleActor {
    if (super.actor.type != "vehicle") throw Error;
    return super.actor;
  }
}

export const sheet = VehicleActorSheet;
export const types = ["vehicle"];
