import { SWNRBaseItem } from "../base-item";
import { SWNRMechActor } from "./mech";

interface MechActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  itemTypes: SWNRMechActor["itemTypes"];
}

export class MechActorSheet extends ActorSheet<
  ActorSheet.Options,
  MechActorSheetData
> {
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
    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
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
    html.find(".item-edit").on("click", this._onItemEdit.bind(this));
    html.find(".item-delete").on("click", this._onItemDelete.bind(this));
    html.find(".item-reload").on("click", this._onItemReload.bind(this));
    html
      .find(".item-toggle-broken")
      .on("click", this._onItemBreakToggle.bind(this));
    html
      .find(".item-toggle-destroy")
      .on("click", this._onItemDestroyToggle.bind(this));
    html.find(".item-click").on("click", this._onItemClick.bind(this));
  }

  // Clickable title/name or icon. Invoke Item.roll()
  _onItemClick(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const itemId = event.currentTarget.parentElement.dataset.itemId;
    const item = <SWNRBaseItem>this.actor.getEmbeddedDocument("Item", itemId);
    //const wrapper = $(event.currentTarget).parents(".item");
    //const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
    if (!item) return;
    item.roll();
  }

  async _onItemDelete(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
    if (!item) return;
    const performDelete: boolean = await new Promise((resolve) => {
      Dialog.confirm({
        title: game.i18n.format("swnr.deleteTitle", { name: item.name }),
        yes: () => resolve(true),
        no: () => resolve(false),
        content: game.i18n.format("swnr.deleteContent", {
          name: item.name,
          actor: this.actor.name,
        }),
      });
    });
    if (!performDelete) return;
    li.slideUp(200, () => {
      requestAnimationFrame(() => {
        this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
      });
    });
  }

  _onItemReload(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
    if (!item) return;
    const ammo_max = item.data.data.ammo?.max;
    if (ammo_max != null) {
      if (item.data.data.ammo.value < ammo_max) {
        console.log("Reloading", item);
        item.update({ "data.ammo.value": ammo_max });
        const content = `<p> Reloaded ${item.name} </p>`;
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: content,
        });
      } else {
        ui.notifications?.info("Trying to reload a full item");
      }
    } else {
      console.log("Unable to find ammo in item ", item.data.data);
    }
  }

  _onItemBreakToggle(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
    const new_break_status = !item?.data.data.broken;
    if (item instanceof Item) item?.update({ "data.broken": new_break_status });
  }

  _onItemDestroyToggle(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
    const new_destroy_status = !item?.data.data.destroyed;
    if (item instanceof Item)
      item?.update({ "data.destroyed": new_destroy_status });
  }

  _onItemEdit(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
    if (item instanceof Item) item.sheet?.render(true);
  }
}

export const sheet = MechActorSheet;
export const types = ["mech"];
