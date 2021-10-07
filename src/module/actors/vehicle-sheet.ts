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

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "ship"],
      template: "systems/swnr/templates/actors/vehicle-sheet.html",
      width: 800,
      height: 600,
    });
  }
}

export const sheet = VehicleActorSheet;
export const types = ["vehicle"];
