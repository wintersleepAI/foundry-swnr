export const registerSettings = function (): void {
  // Register any custom system settings here

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("swnr", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "0.0",
  });

  game.settings.register("swnr", "useHomebrewLuckSave", {
    name: "swnr.settings.useHomebrewLuckSave",
    hint: "swnr.settings.useHomebrewLuckSaveHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("swnr", "useRollNPCHD", {
    name: "swnr.settings.useRollNPCHD",
    hint: "swnr.settings.useRollNPCHDHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("swnr", "addShockMessage", {
    name: "swnr.settings.addShockMessage",
    hint: "swnr.settings.addShockMessageHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
};
