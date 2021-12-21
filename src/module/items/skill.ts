import { SWNRBaseItem } from "./../base-item";
import { ValidatedDialog } from "../ValidatedDialog";

export class SWNRSkill extends SWNRBaseItem<"skill"> {
  popUpDialog?: Dialog;

  async roll(): Promise<void> {
    console.log("Skill roll ", this);
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
    const title = `${game.i18n.localize("swnr.chat.skillCheck")}: ${skillName}`;
    const dialogData = {
      title: title,
      skillName: skillName,
      skill: skillData,
      data: this.actor.data,
    };
    const html = await renderTemplate(template, dialogData);
    const _doRoll = async (html: HTMLFormElement) => {
      console.log(html);
      const rollMode = game.settings.get("core", "rollMode");
      const form = <HTMLFormElement>html[0].querySelector("form");
      const dice = (<HTMLSelectElement>form.querySelector('[name="dicepool"]'))
        .value;
      const stat = this.actor?.data.data["stats"][
        (<HTMLSelectElement>form.querySelector('[name="stat"]')).value
      ] || { mod: 0 };
      const modifier = (<HTMLInputElement>(
        form.querySelector('[name="modifier"]')
      )).value;
      const formula = `${dice} + @stat + @skill + @modifier`;
      const roll = new Roll(formula, {
        skill: skillData.rank,
        modifier: modifier,
        stat: stat.mod,
      });
      await roll.roll({ async: true });
      const title = `${game.i18n.localize(
        "swnr.chat.skillCheck"
      )}: ${game.i18n.localize(
        "swnr.stat.short." +
          (<HTMLSelectElement>form.querySelector('[name="stat"]')).value
      )}/${skillName}`;
      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker(),
          flavor: title,
        },
        { rollMode }
      );
      return roll;
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
