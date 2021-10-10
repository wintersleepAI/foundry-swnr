import { getDefaultImage } from "./utils";
// Avoiding adding an import for data type data
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createSWNRMacro(data, slot: number): Promise<void> {
  if (game == null) return; // Quiet TS
  if (data.type !== "Item") return;
  if (!("data" in data))
    return ui.notifications?.warn(
      "You can only create macro buttons for owned Items"
    );
  const item = data.data;
  const id = data.data._id;
  console.log("creating macro ", id, data);

  // Create the macro command
  const command = `game.swnr.rollItemMacro("${id}","${item.name}");`;
  let macro = game.macros?.contents.find(
    (m) => m.id === id && m.data.command === command
  );
  if (!macro) {
    const default_img = getDefaultImage(item.type);
    const image = default_img ? default_img : item.img;
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: image,
      command: command,
      flags: { "swnr.itemMacro": true },
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
 * @param {string} itemId
 * @return {Promise}
 */
export async function rollItemMacro(
  itemId: string,
  itemName: string
): Promise<void> {
  //if (game == null )  return;
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) {
    actor = game.actors?.tokens[speaker.token];
    if (!actor && speaker.actor) actor = game.actors?.get(speaker.actor);
    if (!actor)
      ui.notifications?.error(
        "Could not find actor for macro roll item. Select token"
      );
    const item = actor ? actor.items.find((i) => i.id === itemId) : null;
    if (!item)
      ui.notifications?.warn(
        `${actor.name} does not have the item ${itemName} you created the macro with`
      );

    // Trigger the item roll
    return item.roll();
  } else {
    ui.notifications?.error("Select token for macro roll item");
  }
}
