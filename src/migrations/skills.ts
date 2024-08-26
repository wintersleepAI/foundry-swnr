import { registerMigration } from "../migration";
import { SWNRBaseItem } from "../module/base-item";

registerMigration(SWNRBaseItem, "0.4.0", 0, (item, pastUpdates) => {
  if (item.data.type === "skill" && item.system.source === "psychic")
    pastUpdates["data.source"] = "Psionic";
  return pastUpdates;
});
