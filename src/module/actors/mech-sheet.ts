import { SWNRMechActor } from "./mech";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";

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

export const sheet = MechActorSheet;
export const types = ["mech"];
