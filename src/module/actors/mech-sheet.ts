import { SWNRMechActor } from "./mech";

interface MechActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRMechActor["itemTypes"];
}

export class MechActorSheet extends ActorSheet<
  ActorSheet.Options,
  MechActorSheetData
> {
  popUpDialog?: Dialog;
  object: SWNRMechActor;

  get actor(): SWNRMechActor {
    if (super.actor.type != "mech") throw Error;
    return super.actor;
  }
}

export const sheet = MechActorSheet;
export const types = ["mech"];
