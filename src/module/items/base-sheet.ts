import { SWNRCharacterActor } from "../actors/character";
import { SWNRDroneActor } from "../actors/drone";
import { SWNRFactionActor } from "../actors/faction";
import { SWNRMechActor } from "../actors/mech";
import { SWNRNPCActor } from "../actors/npc";
import { SWNRShipActor } from "../actors/ship";
import { SWNRVehicleActor } from "../actors/vehicle";
import { SWNRCyberdeckActor } from "../actors/cyberdeck";

interface BaseSheetData extends ItemSheet.Data {
  actor:
    | SWNRCharacterActor
    | SWNRNPCActor
    | SWNRShipActor
    | SWNRDroneActor
    | SWNRVehicleActor
    | SWNRMechActor
    | SWNRFactionActor
    | SWNRCyberdeckActor
    | null;
}
export class BaseSheet extends ItemSheet<DocumentSheet.Options, BaseSheetData> {
  static get defaultOptions(): DocumentSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "item"],
      width: 600,
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

  // Commenting out for now in case it is needed for mods
  // /** @override */
  // activateListeners(html: JQuery): void {
  //   super.activateListeners(html);
  //   html.on("drop", (ev) => {
  //     this._onDrop(ev.originalEvent as DragEvent);
  //   });
  // }

  // protected async _onDrop(event: DragEvent): Promise<boolean | any> {
  //   event.preventDefault();
  //   if (event) {
  //     super._onDrop(event);
  //     if (this.item.data.type !== "cyberware") return false;
  //     let data;
  //     try {
  //       if (event.dataTransfer == null) return false;
  //       data = JSON.parse(event.dataTransfer.getData("text/plain"));
  //       if (data.type === "Item") {
  //         const item = game.items?.find((item) => item.uuid === data.uuid);
  //       }
  //     } catch (err) {
  //       return false;
  //     }
  //   }
  // }
}
export const sheet = BaseSheet;
export const types = [];
