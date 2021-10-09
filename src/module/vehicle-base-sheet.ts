import { SWNRBaseItem } from "./base-item";
import { SWNRShipActor } from "./actors/ship";
import { SWNRMechActor } from "./actors/mech";
import { SWNRDroneActor } from "./actors/drone";
import { SWNRVehicleActor } from "./actors/vehicle";
import { ValidatedDialog } from "./ValidatedDialog";

export class VehicleBaseActorSheet<
  T extends ActorSheet.Data
> extends ActorSheet<ActorSheet.Options, T> {
  popUpDialog?: Dialog;

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
    html.find(".item-create").on("click", this._onItemCreate.bind(this));
    html.find(".crew-delete").on("click", this._onCrewDelete.bind(this));
    html.find(".crew-roll").on("click", this._onCrewSkillRoll.bind(this));
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

  _onItemCreate(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const itemType = $(event.currentTarget).data("itemType");
    if (itemType) {
      this.actor.createEmbeddedDocuments("Item", [
        {
          name: "New Item",
          type: itemType,
        },
      ]);
    }
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

  async _onCrewDelete(event: JQuery.ClickEvent): Promise<void> {
    if (this.actor.type == "character" || this.actor.type == "npc") {
      return;
    }
    const actor:
      | SWNRDroneActor
      | SWNRMechActor
      | SWNRShipActor
      | SWNRVehicleActor = this.actor;
    const li = $(event.currentTarget).parents(".item");
    const performDelete: boolean = await new Promise((resolve) => {
      Dialog.confirm({
        title: game.i18n.format("swnr.deleteCrew", {
          name: li.data("crewName"),
        }),
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
        actor.removeCrew(li.data("crewId"));
      });
    });
  }

  async _onCrewSkillRoll(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const li = $(event.currentTarget).parents(".item");
    const crewActor = game.actors?.get(li.data("crewId"));
    if (!crewActor) {
      ui.notifications?.error(`${li.data("crewName")} no longer exists`);
      return;
    }
    const skills = crewActor.itemTypes.skill;
    const dialogData = {
      actor: crewActor,
      skills: skills,
    };
    const template = "systems/swnr/templates/dialogs/roll-skill-crew.html";
    const html = await renderTemplate(template, dialogData);

    const _rollForm = async (html: HTMLFormElement) => {
      const rollMode = game.settings.get("core", "rollMode");
      const form = <HTMLFormElement>html[0].querySelector("form");
      const dice = (<HTMLSelectElement>form.querySelector('[name="dicepool"]'))
        .value;
      const modifier = parseInt(
        (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
      );
      const skillId = (<HTMLSelectElement>form.querySelector('[name="skill"]'))
        ?.value;
      const skill = crewActor.getEmbeddedDocument(
        "Item",
        skillId
      ) as SWNRBaseItem<"skill">;
      const statName = (<HTMLSelectElement>form.querySelector('[name="stat"]'))
        ?.value;
      const stat = crewActor.data.data["stats"]?.[statName] || {
        mod: 0,
      };
      const formula = `${dice} + @stat + @skill + @modifier`;
      const roll = new Roll(formula, {
        skill: skill.data.data.rank,
        modifier: modifier,
        stat: stat.mod,
      });
      const title = `${game.i18n.localize(
        "swnr.chat.skillCheck"
      )}: ${game.i18n.localize(
        "swnr.stat.short." +
          (<HTMLSelectElement>form.querySelector('[name="stat"]')).value
      )}/${skill.name}`;
      roll.roll();
      roll.toMessage(
        {
          speaker: { alias: crewActor.name },
          flavor: title,
        },
        { rollMode }
      );
    };

    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: game.i18n.format("swnr.dialog.skillRoll", {
          actorName: crewActor?.name,
        }),
        content: html,
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.localize("swnr.chat.roll"),
            callback: _rollForm,
          },
        },
      },
      {
        classes: ["swnr"],
      }
    );
    this.popUpDialog?.render(true);
  }
}

Hooks.on("dropActorSheetData", (actor: Actor, actorSheet: ActorSheet, data) => {
  if (data.type == "Actor") {
    if (actor.type == "ship") {
      const shipActor = (actor as unknown) as SWNRShipActor;
      shipActor.addCrew(data["id"]);
    } else if (actor.type == "mech") {
      const mechActor = (actor as unknown) as SWNRMechActor;
      mechActor.addCrew(data["id"]);
    } else if (actor.type == "drone") {
      const droneActor = (actor as unknown) as SWNRDroneActor;
      droneActor.addCrew(data["id"]);
    } else if (actor.type == "vehicle") {
      const vActor = (actor as unknown) as SWNRVehicleActor;
      vActor.addCrew(data["id"]);
    }
  }
});
