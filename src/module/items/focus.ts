import { SWNRBaseItem } from "./../base-item";
export class SWNRFocus extends SWNRBaseItem<"focus"> {
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
      content+= `<span class="flavor-text"> ${item.data.description}</span>`;

    } else {
      content += "<span class='flavor-text'> No Description</span>"
    }
    if ("level1" in item.data) {
      content+= `<br><b>Level1:</b> ${item.data.level1}`;
    }
  
    if ("level2" in item.data) {
      content+= `<br><b>Level2:</b> ${item.data.level2}`;
    }

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content, //${item.data.description}
      //type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    });
  
  }
}

export const document = SWNRFocus;
export const name = "focus";
