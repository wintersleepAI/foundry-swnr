import { SWNRBaseItem } from "./base-item";
import { SWNRShipActor } from "./actors/ship";
import { SWNRMechActor } from "./actors/mech";
import { SWNRDroneActor } from "./actors/drone";
import { SWNRVehicleActor } from "./actors/vehicle";
import { ValidatedDialog } from "./ValidatedDialog";
import { BaseActorSheet } from "./actor-base-sheet";

export class VehicleBaseActorSheet<
  T extends ActorSheet.Data
> extends BaseActorSheet<T> {
  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html.find(".crew-delete").on("click", this._onCrewDelete.bind(this));
    html.find(".crew-roll").on("click", this._onCrewSkillRoll.bind(this));
    html.find(".crew-show").on("click", this._onCrewShow.bind(this));
  }

  async _onCrewShow(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const li = $(event.currentTarget).parents(".item");
    const crewActor = game.actors?.get(li.data("crewId"));
    crewActor?.sheet?.render(true);
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
