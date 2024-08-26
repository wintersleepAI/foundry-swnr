import { SWNRDroneActor } from "./drone";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";

interface DroneActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRDroneActor["itemTypes"];
}

export class DroneActorSheet extends VehicleBaseActorSheet<DroneActorSheetData> {
  object: SWNRDroneActor;

  get actor(): SWNRDroneActor {
    if (super.actor.type != "drone") throw Error;
    return super.actor;
  }

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "drone"],
      template: "systems/swnr/templates/actors/drone-sheet.html",
      width: 800,
      height: 600,
    });
  }

  async getData(
    options?: Application.RenderOptions
  ): Promise<DroneActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;

    let pilot: SWNRCharacterActor | SWNRNPCActor | null = null;
    if (this.actor.system.crewMembers.length > 0) {
      //should only be 1 or 0 but grabbing first in case it changes.
      const cId = this.actor.system.crewMembers[0];
      const crewMember = game.actors?.get(cId);
      if (crewMember) {
        if (crewMember.type == "character" || crewMember.type == "npc") {
          pilot = crewMember;
        }
      }
    }
    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
      pilot: pilot,
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html
      .find("[name='data.model']")
      .on("change", this._onHullChange.bind(this));
  }

  _onHullChange(event: JQuery.ClickEvent): void {
    const targetHull = event.target?.value;

    if (targetHull) {
      const d = new Dialog({
        title: "Apply Default Stats",
        content: `<p>Do you want to apply the default stats for a ${targetHull}?</p><b>This will change your current and max values for HP, cost, AC, fittings, range, and TL.</b>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: "Yes",
            callback: () => this.actor.applyDefaulStats(targetHull),
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: "No",
            callback: () => {
              console.log("Doing Nothing ");
            },
          },
        },
        default: "no",
      });
      d.render(true);
    }
  }
}

export const sheet = DroneActorSheet;
export const types = ["drone"];
