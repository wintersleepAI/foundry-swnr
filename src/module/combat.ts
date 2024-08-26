export class SWNRCombatant extends Combatant {
  /** @override */
  protected _getInitiativeFormula(): string {
    const actor = this.actor;
    if (actor && game.system.data.initiative) {
      const init = game.system.data.initiative;
      if (actor.type == "character" && actor.system.tweak?.advInit) {
        return `{${game.system.data.initiative},${game.system.data.initiative}}kh`;
      }
      if (actor.type == "ship") {
        if (actor.system.roles.bridge != "") {
          const pilot = game.actors?.get(actor.system.roles.bridge);
          if (pilot && pilot.type == "character") {
            const mod =
              pilot.system.stats.int.mod >= pilot.system.stats.dex.mod
                ? pilot.system.stats.int.mod
                : pilot.system.stats.dex.mod;
            return `1d8+${mod}`;
          }
        }
        return "1d8";
      }
      return init;
    } else {
      ui.notifications?.info(
        "Error getting init roll or actor. Falling back on 1d8"
      );
      return "1d8";
    }
  }
}
