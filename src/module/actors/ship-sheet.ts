import { SWNRShipActor } from "./ship";
import { calculateStats, initSkills, limitConcurrency } from "../utils";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRBaseItem } from "../base-item";
import { SWNRStats, SWNRStatBase, SWNRStatComputed } from "../actor-types";
import { AllItemClasses } from "../item-types";


interface ShipActorSheetData extends ActorSheet.Data {
  itemTypes: SWNRShipActor["itemTypes"];
  abilities: AllItemClasses & { data: { type: "power" | "focus" } };
  equipment: AllItemClasses & {
    data: { type: "armor" | "item" | "weapon" };
  };
}

export class ShipActorSheet extends ActorSheet<
  ActorSheet.Options,
  ShipActorSheetData > {
    popUpDialog?: Dialog;
    object: SWNRShipActor;

    get actor(): SWNRShipActor {
      if (super.actor.type != "ship") throw Error;
      return super.actor;
    }
  
    _injectHTML(html: JQuery<HTMLElement>): void {
      html
        .find(".window-content")
        .addClass(["cq", "overflow-y-scroll", "relative"]);
      super._injectHTML(html);
    }
  
    async getData(
      options?: Application.RenderOptions
    ): Promise<ShipActorSheetData> {
      let data = super.getData(options);
      if (data instanceof Promise) data = await data;
      return mergeObject(data, {
        itemTypes: this.actor.itemTypes,
        abilities: this.actor.items.filter(
          (i: SWNRBaseItem) => ["power", "focus"].indexOf(i.data.type) !== -1
        ),
        equipment: this.actor.items.filter(
          (i: SWNRBaseItem) =>
            ["armor", "item", "weapon"].indexOf(i.data.type) !== -1
        ),
      });
    }
    static get defaultOptions(): ActorSheet.Options {
      return mergeObject(super.defaultOptions, {
        classes: ["swnr", "sheet", "actor", "ship"],
        template: "systems/swnr/templates/actors/ship-sheet.html",
        width: 750,
        height: 600,
      });
    }
  
    activateListeners(html: JQuery): void {
      super.activateListeners(html);
    }
  

}
export const sheet = ShipActorSheet;
export const types = ["ship"];
