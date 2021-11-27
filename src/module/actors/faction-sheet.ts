import { AllItemClasses } from "../item-types";
import { BaseActorSheet } from "../actor-base-sheet";
import { SWNRBaseItem } from "../base-item";
import { SWNRFactionActor } from "./faction";
import { SWNRAsset } from "../items/asset";

interface FactionActorSheetData extends ActorSheet.Data {
  itemTypes: SWNRFactionActor["itemTypes"];
  assets: AllItemClasses & { data: { type: "asset" } };
}
export class FactionActorSheet extends BaseActorSheet<FactionActorSheetData> {
  popUpDialog?: Dialog;

  get actor(): SWNRFactionActor {
    if (super.actor.type !== "faction") throw Error;
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
  ): Promise<FactionActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;
    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
    });
  }

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "faction"],
      template: "systems/swnr/templates/actors/faction-sheet.html",
      width: 750,
      height: 600,
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
  }
}

export const sheet = FactionActorSheet;
export const types = ["faction"];
