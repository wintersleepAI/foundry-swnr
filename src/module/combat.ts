export class SWNRCombatant extends Combatant {
  /** @override */
  protected _getInitiativeFormula(): string {
    const actor = this.actor;
    if (actor && game.system.data.initiative) {
      const init = game.system.data.initiative;
      if (actor.type == "character"  && actor.data.data.tweak?.advInit) {
        return `{${game.system.data.initiative},${game.system.data.initiative}}kh`
      }
      if (actor.type == "ship"){
        if (actor.data.data.roles.bridge!= ""){
          let pilot = game.actors?.get(actor.data.data.roles.bridge);
          if (pilot && pilot.type=="character"){
            let mod = (pilot.data.data.stats.int.mod>=pilot.data.data.stats.dex.mod) ? pilot.data.data.stats.int.mod : pilot.data.data.stats.dex.mod;
            return `1d8+${mod}`;
          }
        }
        return "1d8";
      }
      return init;
    } else {
      ui.notifications?.info("Error getting init roll or actor. Falling back on 1d8");
      return "1d8";
    }
  }
}
