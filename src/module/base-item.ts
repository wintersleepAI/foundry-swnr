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
async roll() {
  if (this.actor == null) {
    console.log("Cannot role without an actor");
    return;
  } 
  console.log("rolling item ", this)
  // Basic template rendering data
  const token = this.actor.token;
  const item = this.data;
  const actorData = this.actor ? this.actor.data.data : {};
  const itemData = item.data;

  // Define the roll formula.
  let roll = new Roll('d20', actorData);// +@abilities.str.mod
  let label = `Rolling ${item.name}`;
  // Roll and send to chat.
  roll.roll().toMessage({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    flavor: label
  });
}
}
