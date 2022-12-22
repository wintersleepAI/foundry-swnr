import { SWNRCharacterActor } from "../actors/character";
import { SWNRDroneActor } from "../actors/drone";
import { SWNRFactionActor } from "../actors/faction";
import { SWNRMechActor } from "../actors/mech";
import { SWNRNPCActor } from "../actors/npc";
import { SWNRShipActor } from "../actors/ship";
import { SWNRVehicleActor } from "../actors/vehicle";

interface BaseSheetData extends ItemSheet.Data {
  actor:
    | SWNRCharacterActor
    | SWNRNPCActor
    | SWNRShipActor
    | SWNRDroneActor
    | SWNRVehicleActor
    | SWNRMechActor
    | SWNRFactionActor
    | null;
}
export class BaseSheet extends ItemSheet<DocumentSheet.Options, BaseSheetData> {
  static get defaultOptions(): DocumentSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [],
    });
  }

  _injectHTML(html: JQuery<HTMLElement>): void {
    html
      .find(".window-content")
      .addClass(["cq", "overflow-y-scroll", "relative"]);
    super._injectHTML(html);
  }

  /**
   * @override
   */
  get template(): string {
    return `systems/swnr/templates/items/${this.item.data.type}-sheet.html`;
  }

  async getData(): Promise<BaseSheetData> {
    let data = super.getData();
    if (data instanceof Promise) data = await data;
    data.actor = this.actor;
    return data;
  }
}
export const sheet = BaseSheet;
export const types = [];
