import { SWNRShipActor } from "./ship";
import { calculateStats, initSkills, limitConcurrency } from "../utils";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRBaseItem } from "../base-item";
import { SWNRStats, SWNRStatBase, SWNRStatComputed } from "../actor-types";
import { AllItemClasses } from "../item-types";
import { SWNRBaseActor } from "../base-actor";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";


interface ShipActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  crewMembers?: string[]; // ActorIds
  itemTypes: SWNRShipActor["itemTypes"];
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

      let crewArray: Array<SWNRCharacterActor| SWNRNPCActor> = [];
      if (this.actor.data.data.crewMembers) {
        for (var i in this.actor.data.data.crewMembers ){
          let cId = this.actor.data.data.crewMembers[i];
          let crewMember=game.actors?.get(cId);
          if (crewMember && (crewMember.type=="character" || crewMember.type=="npc")){
            crewArray.push(crewMember);
            //console.log(crewArray);
          }  
        }
        //console.log("CA", crewArray);
      } else {
        //console.log("no crewmembers");
      }

      return mergeObject(data, {
        itemTypes: this.actor.itemTypes,
        abilities: this.actor.items.filter(
          (i: SWNRBaseItem) => ["power", "focus"].indexOf(i.data.type) !== -1
        ),
        equipment: this.actor.items.filter(
          (i: SWNRBaseItem) =>
            ["armor", "item", "weapon"].indexOf(i.data.type) !== -1
        ),
        crewArray: crewArray,
      });
    }
    static get defaultOptions(): ActorSheet.Options {
      return mergeObject(super.defaultOptions, {
        classes: ["swnr", "sheet", "actor", "ship"],
        template: "systems/swnr/templates/actors/ship-sheet.html",
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
      html.find(".crew-delete").on("click", this._onCrewDelete.bind(this));

      html.find(".item-toggle-broken").on("click", this._onItemBreakToggle.bind(this));
      html.find(".item-click").on("click", this._onItemClick.bind(this));

    }
  
    // Clickable title/name or icon. Invoke Item.roll()
    _onItemClick(event: JQuery.ClickEvent): void {
      event.preventDefault();
      event.stopPropagation();
      const itemId = event.currentTarget.parentElement.dataset.itemId;
      const item = <SWNRBaseItem>(
        this.actor.getEmbeddedDocument("Item", itemId)
      );
      //const wrapper = $(event.currentTarget).parents(".item");
      //const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
      if (!item) return;
      item.roll();
    }

    _onItemBreakToggle(event: JQuery.ClickEvent): void {
      event.preventDefault();
      event.stopPropagation();
      const wrapper = $(event.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
      const new_break_status = !item?.data.data.broken;
      if (item instanceof Item) item?.update({"data.broken" : new_break_status});

    }
    _onItemEdit(event: JQuery.ClickEvent): void {
      event.preventDefault();
      event.stopPropagation();
      const wrapper = $(event.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
      if (item instanceof Item) item.sheet?.render(true);
    }

    async _onCrewDelete(event: JQuery.ClickEvent): Promise<void> {
      event.preventDefault();
      event.stopPropagation();
      const li = $(event.currentTarget).parents(".item");
      console.log("id", li.data("crewId"), li.data("crewName"));

      const performDelete: boolean = await new Promise((resolve) => {
        Dialog.confirm({
          title: game.i18n.format("swnr.deleteCrew", { name: li.data("crewName") }),
          yes: () => resolve(true),
          no: () => resolve(false),
          content: game.i18n.format("swnr.deleteCrew", {
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
}

Hooks.on(
  "dropActorSheetData",
  (actor: Actor, actorSheet: ActorSheet, data) => {
    if (actor.type=="ship" && data.type == "Actor") {
      const shipActor = actor as unknown as SWNRShipActor;
      shipActor.addCrew(data["id"]);
    }
  }
);
export const sheet = ShipActorSheet;
export const types = ["ship"];
