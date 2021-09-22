import { SWNRBaseItem } from "../base-item";

export class SWNRShipDefense extends SWNRBaseItem<"shipDefense"> {
  async roll(): Promise<void> {
    if (this.actor == null) {
      console.log("Cannot role without an actor");
      return;
    }
    console.log("Rolling focus ", this)
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;
    let content = `<h3> ${item.name} </h3>`
    if ("description" in item.data) {
      content += `<span class="flavor-text"> ${item.data.description}</span>`;

    } else {
      content += "<span class='flavor-text'> No Description</span>"
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
