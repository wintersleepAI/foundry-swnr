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

  // (name:string, options = {}:TextEditor.Options, initialContent = ""
  activateEditor(
    name: string,
    options = {} as TextEditor.Options,
    initialContent = ""
  ): void {
    options.relativeLinks = true;
    options.plugins = {
      menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
        compact: true,
        destroyOnSave: true,
        onSave: () => this.saveEditor(name, {remove: true})
      })
    };
    return super.activateEditor(name, options, initialContent);
  }
  /**
   * @override
   */
  get template(): string {
    return `systems/swnr/templates/items/${this.item.data.type}-sheet.html`;
  }

  async getData(): Promise<BaseSheetData> {
    let data = await super.getData();
    if (data instanceof Promise) data = await data;
    data.actor = this.actor;
    let desc = this.item.data.data["description"] ?  this.item.data.data["description"] : "";
    foundry.utils.mergeObject(data, {
          // Enrich HTML description
          descriptionHTML: await TextEditor.enrichHTML(desc, {
            secrets: this.item.isOwner,
            async: true,
            relativeTo: this.item
          }),
        }
    );
    return data;
  }
}
export const sheet = BaseSheet;
export const types = [];
