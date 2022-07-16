export class SWNRBaseItem<
  Type extends Item["type"] = Item["type"]
> extends Item {
  //@ts-expect-error Subtype override
  data: Item["data"] & { _source: { type: Type }; type: Type };

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async roll(_shiftKey = false): Promise<void> {
    this.showDesc();
  }

  async showDesc(): Promise<void> {
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

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content, //${item.data.description}
      //type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    });
  }
}
