import { SWNRBaseItem } from "./base-item";
import { SWNRShipActor } from "./actors/ship";
import { SWNRMechActor } from "./actors/mech";
import { SWNRDroneActor } from "./actors/drone";
import { SWNRVehicleActor } from "./actors/vehicle";
import { ValidatedDialog } from "./ValidatedDialog";
import { BaseActorSheet } from "./actor-base-sheet";
import { SWNRShipDefense } from "./items/shipDefense";
import { SWNRShipFitting } from "./items/shipFitting";
import { SWNRShipWeapon } from "./items/shipWeapon";
import { SWNRAllVehicleClasses } from "./actor-types";

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
    const isChar = crewActor.type == "character" ? true : false;
    const dialogData = {
      actor: crewActor,
      skills: skills,
      isChar,
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
      const useNPCSkillBonus = (<HTMLInputElement>(
        form.querySelector('[name="useNPCSkillBonus"]')
      ))?.checked
        ? true
        : false;
      const npcSkillBonus =
        useNPCSkillBonus && crewActor.type == "npc"
          ? crewActor.data.data.skillBonus
          : 0;
      const skillBonus = skill ? skill.data.data.rank : npcSkillBonus;
      const statName = (<HTMLSelectElement>form.querySelector('[name="stat"]'))
        ?.value;
      const stat = crewActor.data.data["stats"]?.[statName] || {
        mod: 0,
      };
      const formula = `${dice} + @stat + @skillBonus + @modifier`;
      const roll = new Roll(formula, {
        skillBonus,
        modifier,
        stat: stat.mod,
      });
      const skillName = skill ? skill.name : "No Skill";
      const statNameDisply = statName
        ? game.i18n.localize("swnr.stat.short." + statName)
        : "No Stat";
      const title = `${game.i18n.localize(
        "swnr.chat.skillCheck"
      )}: ${statNameDisply}/${skillName}`;
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

// Compare ship hull sizes.
// -1 ship1 is smaller, 0 same, 1 ship1 is larger
function compareShipClass(
  ship1: SWNRAllVehicleClasses,
  ship2: SWNRAllVehicleClasses
): number {
  const sizeMap = {
    fighter: 0,
    frigate: 1,
    cruiser: 2,
    capital: 3,
  };
  const size1 = sizeMap[ship1] ? sizeMap[ship1] : 0;
  const size2 = sizeMap[ship2] ? sizeMap[ship2] : 0;
  return size1 - size2;
}

// Compare mech hull sizes.
// <0 ship1 is smaller, 0 same, >0 ship1 is larger
function compareMechClass(
  ship1: SWNRAllVehicleClasses,
  ship2: SWNRAllVehicleClasses
): number {
  const sizeMap = {
    suit: 0,
    light: 1,
    heavy: 2,
  };
  const size1 = sizeMap[ship1] ? sizeMap[ship1] : 0;
  const size2 = sizeMap[ship2] ? sizeMap[ship2] : 0;
  return size1 - size2;
}

// Compare vehicle hull sizes.
// <0 ship1 is smaller, 0 same, >0 ship1 is larger
function compareVehicleClass(
  ship1: SWNRAllVehicleClasses,
  ship2: SWNRAllVehicleClasses
): number {
  const sizeMap = {
    s: 0,
    m: 1,
    l: 2,
  };
  const size1 = sizeMap[ship1] ? sizeMap[ship1] : 0;
  const size2 = sizeMap[ship2] ? sizeMap[ship2] : 0;
  return size1 - size2;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Hooks.on("preCreateItem", (item: Item, data, options, id) => {
  if (
    item.type == "shipWeapon" ||
    item.type == "shipDefense" ||
    item.type == "shipFitting"
  ) {
    if (
      item.parent?.type == "ship" ||
      item.parent?.type == "mech" ||
      item.parent?.type == "vehicle"
    ) {
      if (
        item.name == "New Item" ||
        item.name == "New Weapon" ||
        item.name == "New Defense" ||
        item.name == "New Fitting"
      ) {
        //ugly but works for now. need a better way to check.
        return;
      }
      //TODO fix. This is get around Typescript complaints. Know we are valid by above if
      const shipItem = <SWNRShipDefense | SWNRShipWeapon | SWNRShipFitting>(
        (item as unknown)
      );
      const data = shipItem.data.data;
      if (item.parent.type == "ship" && shipItem.data.data.type == "ship") {
        const shipClass = item.parent.data.data.shipClass;
        if (
          data.minClass != "" &&
          compareShipClass(shipClass, data.minClass) < 0
        ) {
          ui.notifications?.error(
            `Item minClass (${data.minClass}) is too large for (${shipClass}). Still adding. `
          );
        }
      } else if (
        item.parent.type == "mech" &&
        shipItem.data.data.type == "mech"
      ) {
        const mechClass = item.parent.data.data.mechClass;
        if (
          data.minClass != "" &&
          compareMechClass(mechClass, data.minClass) < 0
        ) {
          ui.notifications?.error(
            `Item minClass (${data.minClass}) is too large for (${mechClass}). Still adding. `
          );
        }
      } else if (
        item.parent.type == "vehicle" &&
        shipItem.data.data.type == "vehicle"
      ) {
        const vehicleClass = item.parent.data.data.size;
        if (
          data.minClass != "" &&
          compareVehicleClass(vehicleClass, data.minClass) < 0
        ) {
          ui.notifications?.error(
            `Item minClass (${data.minClass}) is too large for (${vehicleClass}). Still adding. `
          );
        }
      }
    } else {
      //console.log('Only ship items can go to a ship?', item);
    }
  }
  return item;
});
