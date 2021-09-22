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
      html.find(".travel-button").on("click", this._onTravel.bind(this));
      html.find(".spike-button").on("click", this._onSpike.bind(this));
      html.find(".refuel-button").on("click", this._onRefuel.bind(this));
      html.find(".crisis-button").on("click", this._onCrisis.bind(this));
      html.find("[name='data.shipHullType']").on("change", this._onHullChange.bind(this));
    }
    _onHullChange(event: JQuery.ClickEvent): void {
      let targetHull = event.target?.value;

    if (targetHull) {
      let d = new Dialog({
        title: "Apply Default Stats",
        content: `<p>Do you want to apply the default stats for a ${targetHull}?</p>`,
        buttons: {
          one: {
            icon: '<i class="fas fa-check"></i>',
            label: "Yes",
            callback: () => this.actor.applyDefaulStats(targetHull)
          },
          two: {
            icon: '<i class="fas fa-times"></i>',
            label: "No",
            callback: () => {console.log("Doing nothing")}
          }
        },
        default: "two",
      });
      d.render(true);
    }
  }


    _onTravel(event: JQuery.ClickEvent): void {
      new Dialog({
        title:'Example Dialog',
        content:`
          <form>
            <div class="form-group">
              <label>Days of Travel</label>
              <input type='text' name='inputField'></input>
            </div>
          </form>`,
        buttons:{
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Travel`
          }},
        default:'yes',
        close: html => {
          const form = <HTMLFormElement>html[0].querySelector("form");
          const days = (<HTMLInputElement>form.querySelector('[name="inputField"]'))?.value;
          if (days && days!=""){
            let nDays = Number(days);
            if (nDays){
                if (this.actor.data.data.crew.current > 0) {
                  let newLifeDays = this.actor.data.data.lifeSupportDays.value;
                  newLifeDays-= (this.actor.data.data.crew.current * nDays);
                  this.actor.update({
                    "data.lifeSupportDays.value":newLifeDays
                  });
                  if (newLifeDays <= 0) {
                    ui.notifications?.error("Out of life support!!!");
                  }
                }
            }  else {
              ui.notifications?.error(days + " is not a number");
            }          
          }
        }
      }).render(true);

    }
    _onSpike(event: JQuery.ClickEvent): void {
      ui.notifications?.info("spike drill");
    }
    _onRefuel(event: JQuery.ClickEvent): void {
      const data = this.actor.data.data;
      this.actor.update(
        { 
          "data.lifeSupportDays.value" :data.lifeSupportDays.max,
          "data.fuel.value" : data.fuel.max,
      });
      ui.notifications?.info("Refuelled");
    }
    _onCrisis(event: JQuery.ClickEvent): void {
      ui.notifications?.info("crisis");
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
