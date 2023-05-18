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

    const cardData = {
      item: this.data,
    };
    const template = "systems/swnr/templates/chat/item-desc.html";

    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: await renderTemplate(template, cardData),
    };
    await ChatMessage.create(chatData);
  }
}
