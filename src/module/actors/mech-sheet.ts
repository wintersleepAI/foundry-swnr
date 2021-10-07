import { SWNRMechActor } from "./mech";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";

interface MechActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRMechActor["itemTypes"];
}

export class MechActorSheet extends VehicleBaseActorSheet<MechActorSheetData> {
  popUpDialog?: Dialog;
  object: SWNRMechActor;

  get actor(): SWNRMechActor {
    if (super.actor.type != "mech") throw Error;
    return super.actor;
  }

  async getData(
    options?: Application.RenderOptions
  ): Promise<MechActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;
    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
    });
  }

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "ship"],
      template: "systems/swnr/templates/actors/mech-sheet.html",
      width: 800,
      height: 600,
      tabs: [
        {
          navSelector: ".pc-sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "mods",
        },
      ],
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
  }
}

export const sheet = MechActorSheet;
export const types = ["mech"];
