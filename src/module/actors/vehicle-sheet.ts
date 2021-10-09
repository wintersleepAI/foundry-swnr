import { SWNRVehicleActor } from "./vehicle";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";

interface VehicleActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRVehicleActor["itemTypes"];
}

export class VehicleActorSheet extends VehicleBaseActorSheet<VehicleActorSheetData> {
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

  async getData(
    options?: Application.RenderOptions
  ): Promise<VehicleActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;

    const crewArray: Array<SWNRCharacterActor | SWNRNPCActor> = [];
    if (this.actor.data.data.crewMembers) {
      for (let i = 0; i < this.actor.data.data.crewMembers.length; i++) {
        const cId = this.actor.data.data.crewMembers[i];
        const crewMember = game.actors?.get(cId);
        if (
          crewMember &&
          (crewMember.type == "character" || crewMember.type == "npc")
        ) {
          crewArray.push(crewMember);
          //console.log(crewArray);
        }
      }
      //console.log("CA", crewArray);
    } else {
      //console.log("no crewmembers");
    }

    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
      crewArray: crewArray,
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
  }
}

export const sheet = VehicleActorSheet;
export const types = ["vehicle"];
