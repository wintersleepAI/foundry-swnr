export async function createSWNRMacro(data, slot) {
    if (game == null) return; // Quiet TS
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications?.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    console.log(data);
  
    // Create the macro command
    const command = `game.swnr.rollItemMacro("${item.name}");`;
    let macro = game.macros?.contents.find(m => (m.name === item.name) && (m.data.command === command));
    if (!macro) {
      let image = item.img;
      const icon_path = "systems/swnr/assets/icons/game-icons.net/item-icons"
      if (item.type == "skill") image = `${icon_path}/book-white.svg` ;
      else if (item.type == "armor") image = `${icon_path}/armor-white.svg` ;
      else if (item.type == "weapon") image = `${icon_path}/weapon-white.svg` ;
      else if (item.type == "power") image = `${icon_path}/psychic-waves-white.svg` ;
      else console.log("Unknow item type, no icon ", item.type);

      macro = await Macro.create({
        name: item.name,
        type: "script",
        img: image,
        command: command,
        flags: { "swnr.itemMacro": true }
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
 export function rollItemMacro(itemName: String) {
    //if (game == null )  return; 
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) {
        actor = game.actors?.tokens[speaker.token];
        if (!actor && speaker.actor) actor = game.actors?.get(speaker.actor); 
        if (!actor) return ui.notifications?.error("Could not find actor for macro roll item. Select token");
        const item = actor ? actor.items.find(i => i.name === itemName) : null;
        if (!item) return ui.notifications?.warn(`${actor.name} does not have an item named ${itemName}`);

        // Trigger the item roll
        return item.roll();
    } else {
        ui.notifications?.error("Select token for macro roll item");
    }
  }
