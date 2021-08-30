export function tester(): void {
    ui.notifications?.error("tester");
}


export async function createSWNRMacro(data, slot) {
    if (game == null) return; // Quiet TS
    ui.notifications?.error("got it");
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications?.warn("You can only create macro buttons for owned Items");
    const item = data.data;
  
    // Create the macro command
    const command = `game.swnr.rollItemMacro("${item.name}");`;
    let macro = game.macros?.entities.find(m => (m.name === item.name) && (m.data.command === command));
    if (!macro) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: { "boilerplate.itemMacro": true }
      });
    }
    if (macro == null) {
        console.log("Was not able to create or find macro");
        return;
    }
    game.user?.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
 function rollItemMacro(itemName) {
    if (game == null ){
        return;
    }
    console.log(itemName);
      // Define the roll formula.
    let roll = new Roll('d20', this.Actor);// +@abilities.str.mod
    let label = `Rolling ${itemName}`;
    // Roll and send to chat.
    roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
    });
    // const speaker = ChatMessage.getSpeaker();
    // let actor;
    // if (speaker.token) actor = game.actors?.tokens[speaker.token];
    // if (!actor) actor = game.actors?.get(speaker.actor);
    // const item = actor ? actor.items.find(i => i.name === itemName) : null;
    // if (!item) return ui.notifications?.warn(`Your controlled Actor does not have an item named ${itemName}`);
  
    // // Trigger the item roll
    // return item.roll();
  }
