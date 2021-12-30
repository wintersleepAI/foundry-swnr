import { AllItemClasses } from "../item-types";
import { BaseActorSheet } from "../actor-base-sheet";
import { SWNRFactionActor } from "./faction";

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

  async _onAssetCreate(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const itemType = $(event.currentTarget).data("itemType");
    const givenName = $(event.currentTarget).data("itemName");
    const itemName = givenName ? `New ${givenName}` : "New Item";
    const imgPath = getDefaultImage(itemType);
    if (itemType) {
      this.actor.createEmbeddedDocuments(
        "Item",
        [
          {
            name: itemName,
            type: itemType,
            img: imgPath,
          },
        ],
        {}
      );
    }
  }

  getDefaultImage(itemType: string): string | null {
    const icon_path = "systems/swnr/assets/icons/game-icons.net/item-icons";
    const imgMap = {
      shipWeapon: "sinusoidal-beam.svg",
      shipDefense: "bubble-field.svg",
      shipFitting: "power-generator.svg",
      cyberware: "cyber-eye.svg",
      focus: "reticule.svg",
      armor: "armor-white.svg",
      weapon: "weapon-white.svg",
      power: "psychic-waves-white.svg",
      skill: "book-white.svg",
    };
    if (itemType in imgMap) {
      return `${icon_path}/${imgMap[itemType]}`;
    } else {
      return "icons/svg/item-bag.svg";
    }
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
      tabs: [
        {
          navSelector: ".pc-sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "assets",
        },
      ],
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
  }
}

export const sheet = FactionActorSheet;
export const types = ["faction"];
