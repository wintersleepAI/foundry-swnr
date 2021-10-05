/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your system, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your system
 */

// Import TypeScript modules
import { registerSettings } from "./module/settings";
import migrations from "./migration";
import { preloadTemplates } from "./module/preloadTemplates";
import { SWNRActor, SWNRItem } from "./module/documents";
import "./module/containerQueries";
import registerHelpers from "./module/handlebar-helpers";
import { createSWNRMacro, rollItemMacro } from "./module/macro-bar";
import { SWNRCombatant } from "./module/combat";

/* ------------------------------------ */
/* Initialize system					*/
/* ------------------------------------ */
Hooks.once("init", async function () {
  console.log("swnr | Initializing Stars Without Number Revised");

  // Assign custom classes and constants here
  CONFIG.Combatant.documentClass = SWNRCombatant;

  // Register custom system settings
  registerSettings();
  CONFIG.Actor.documentClass = SWNRActor;
  CONFIG.Item.documentClass = SWNRItem;
  // Preload Handlebars templates
  await preloadTemplates();
  game.i18n.localize("swnr.title");
  game["swnr"] = {
    rollItemMacro,
  };

  // Remove stock sheets
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);
  registerHelpers();
});
declare let _templateCache: {
  [key: string]: (data: Record<string, unknown>) => string;
};
function limiter(fn: (...any: unknown[]) => unknown, wait: number) {
  let isCalled = false;

  return function () {
    if (!isCalled) {
      fn();
      isCalled = true;
      setTimeout(function () {
        isCalled = false;
      }, wait);
    }
  };
}
export const nukeTemplates = limiter(async function nukeTemplates() {
  Object.keys(_templateCache)
    .filter((e) => e.startsWith("systems/swnr"))
    .forEach((element) => {
      delete _templateCache[element];
    });
  await preloadTemplates();
}, 5000);

/* ------------------------------------ */
/* Setup system							*/
/* ------------------------------------ */
Hooks.once("setup", function () {
  // Do anything after initialization but before
  // ready
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once("ready", function () {
  // Do anything once the system is ready
  // Reference a Compendium pack by it's collection ID
  // packImport();
  migrations();
  Hooks.on("hotbarDrop", (bar, data, slot) => createSWNRMacro(data, slot));
});
