import { SWNRBaseItem } from "./../base-item";

export class SWNRPower extends SWNRBaseItem<"power"> {
  popUpDialog?: Dialog;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async roll(_shiftKey = false): Promise<void> {
    if (!this.actor) {
      const message = `Called power.roll on item without an actor.`;
      ui.notifications?.error(message);
      new Error(message);
      return;
    }
    const powerRoll = new Roll(this.system.roll ? this.system.roll : "0");
    await powerRoll.roll({ async: true });
    const dialogData = {
      actor: this.actor.data,
      power: this,
      powerRoll: await powerRoll.render(),
    };
    const rollMode = game.settings.get("core", "rollMode");

    const template = "systems/swnr/templates/chat/power-roll.html";
    const chatContent = await renderTemplate(template, dialogData);
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor ?? undefined }),
      content: chatContent,
      roll: JSON.stringify(powerRoll),
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
    getDocumentClass("ChatMessage").create(chatData);
  }
}

export const document = SWNRPower;
export const name = "power";
