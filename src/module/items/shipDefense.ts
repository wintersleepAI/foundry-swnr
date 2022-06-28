import { SWNRBaseItem } from "../base-item";

export class SWNRShipDefense extends SWNRBaseItem<"shipDefense"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async roll(_shiftKey = false): Promise<void> {
    if (this.data.data.broken || this.data.data.destroyed) {
      ui.notifications?.error(
        "Defense is broken/disabled or destroyed. Cannot use!"
      );
      return;
    }
    if (this.actor == null) {
      console.log("Cannot role without an actor");
      return;
    }
    // Basic template rendering data
    const item = this.data;
    let content = `<h3> ${item.name} </h3>`;
    if ("description" in item.data) {
      content += `<span class="flavor-text"> ${item.data.description}</span>`;
    } else {
      content += "<span class='flavor-text'> No Description</span>";
    }
    if ("effect" in item.data) {
      content += `<br> <b>${item.data.effect}</b>`;
    }

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content, //${item.data.description}
      //type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    });
  }
}

export const document = SWNRShipDefense;
export const name = "shipDefense";
