import { SWNRBaseItem } from "./../base-item";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRStats } from "../actor-types";

export class SWNRSkill extends SWNRBaseItem<"skill"> {
  popUpDialog?: Dialog;

  async rollSkill(
    skillName: string | null,
    statShortName: string,
    statMod: number,
    dice: string,
    skillRank: number,
    modifier: string | number
  ): Promise<void> {
    const rollMode = game.settings.get("core", "rollMode");

    const formula = `${dice} + @stat + @skill + @modifier`;
    const roll = new Roll(formula, {
      skill: skillRank,
      modifier: modifier,
      stat: statMod,
    });
    await roll.roll({ async: true });
    const title = `${game.i18n.localize(
      "swnr.chat.skillCheck"
    )}: ${statShortName}/${skillName}`;
    roll.toMessage(
      {
        speaker: ChatMessage.getSpeaker(),
        flavor: title,
      },
      { rollMode }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async roll(shiftKey = false): Promise<void> {
    const skillData = this.data.data;
    const template = "systems/swnr/templates/dialogs/roll-skill.html";
    if (this.actor == null) {
      const message = `Called rollSkill without an actor.`;
      ui.notifications?.error(message);
      return;
    } else if (this.actor.type != "character") {
      ui.notifications?.error("Calling roll skill on non-character");
      return;
    }
    const skillName = this.name;

    // Set to not ask and just roll
    if (!shiftKey && this.system.remember && this.system.remember.use) {
      const modifier = this.system.remember.modifier;
      const defaultStat = this.system.defaultStat;
      const dice = this.system.pool;
      const skillRank = this.system.rank;
      if (defaultStat == "ask" || dice == "ask") {
        ui.notifications?.info(
          "Quick roll set, but dice or stat is set to ask"
        );
      } else {
        const stat = this.actor?.data.data["stats"][defaultStat] || {
          mod: 0,
        };
        const statShortName = game.i18n.localize(
          "swnr.stat.short." + defaultStat
        );
        this.rollSkill(
          skillName,
          statShortName,
          stat.mod,
          dice,
          skillRank,
          modifier
        );
        return;
      }
    }
    const modifier =
      this.system.remember && this.system.remember.modifier
        ? this.system.remember.modifier
        : 0;
    const title = `${game.i18n.localize("swnr.chat.skillCheck")}: ${skillName}`;
    const dialogData = {
      title: title,
      skillName: skillName,
      skill: skillData,
      data: this.actor.data,
      modifier,
    };
    const html = await renderTemplate(template, dialogData);
    const _doRoll = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const dice = (<HTMLSelectElement>form.querySelector('[name="dicepool"]'))
        .value;
      const statShortNameForm = (<HTMLSelectElement>(
        form.querySelector('[name="stat"]')
      )).value;
      if (
        ["str", "dex", "con", "int", "wis", "cha"].includes(
          statShortNameForm
        ) == false
      ) {
        ui.notifications?.error("Stat must be set and not ask");
        return;
      }
      if (["2d6", "3d6kh2", "4d6kh2"].includes(dice) == false) {
        ui.notifications?.error("Dice must be set and not ask");
        return;
      }
      const stat = this.actor?.data.data["stats"][statShortNameForm] || {
        mod: 0,
      };
      const modifier = (<HTMLInputElement>(
        form.querySelector('[name="modifier"]')
      )).value;
      if (Number.isNaN(Number(modifier))) {
        ui.notifications?.error("Modifier is not a number");
        return;
      }
      const statShortName = game.i18n.localize(
        "swnr.stat.short." + statShortNameForm
      );

      // If remember is checked, set the skill and data
      const remember = (<HTMLInputElement>(
        form.querySelector('[name="remember"]')
      ))?.checked
        ? true
        : false;
      if (remember) {
        await this.update({
          data: {
            remember: {
              use: true,
              modifier: Number(modifier),
            },
            defaultStat: <SWNRStats>statShortNameForm,
            pool: <"2d6" | "3d6kh2" | "4d6kh2">dice,
          },
        });
      }

      this.rollSkill(
        skillName,
        statShortName,
        stat.mod,
        dice,
        skillData.rank,
        modifier
      );
    };
    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: title,
        content: html,
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.localize("swnr.chat.roll"),
            callback: _doRoll,
          },
        },
      },
      {
        failCallback: () => {
          return;
        },
        classes: ["swnr"],
      }
    );
    const s = this.popUpDialog.render(true);
    if (s instanceof Promise) await s;
  }
}

export const document = SWNRSkill;
export const name = "skill";
