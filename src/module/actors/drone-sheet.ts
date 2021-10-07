import { SWNRDroneActor } from "./drone";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";

interface DroneActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRDroneActor["itemTypes"];
}

export class DroneActorSheet extends VehicleBaseActorSheet<DroneActorSheetData> {
  popUpDialog?: Dialog;
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
    if (this.actor.data.data.crewMembers.length > 0) {
      //should only be 1 or 0 but grabbing first in case it changes.
      const cId = this.actor.data.data.crewMembers[0];
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
    html.find(".crew-delete").on("click", this._onCrewDelete.bind(this));
  }

  async _onCrewDelete(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const li = $(event.currentTarget).parents(".item");
    console.log("id", li.data("crewId"), li.data("crewName"));
    const performDelete: boolean = await new Promise((resolve) => {
      Dialog.confirm({
        title: game.i18n.format("swnr.deletePilot", {
          name: li.data("crewName"),
        }),
        yes: () => resolve(true),
        no: () => resolve(false),
        content: game.i18n.format("swnr.deletePilot", {
          name: li.data("crewName"),
          actor: this.actor.name,
        }),
      });
    });
    if (!performDelete) return;
    li.slideUp(200, () => {
      requestAnimationFrame(() => {
        this.actor.removeCrew(li.data("crewId"));
      });
    });
  }
}

export const sheet = DroneActorSheet;
export const types = ["drone"];
