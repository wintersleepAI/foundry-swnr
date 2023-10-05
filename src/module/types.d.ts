import { VersionString } from "../migration";
import { SWNRCharacterActor } from "./actors/character";
import { SWNRDroneActor } from "./actors/drone";
import { SWNRMechActor } from "./actors/mech";
import { SWNRNPCActor } from "./actors/npc";
import { SWNRShipActor } from "./actors/ship";
import { SWNRFactionActor } from "./actors/faction";
import { SWNRVehicleActor } from "./actors/vehicle";
import { SWNRBaseItem } from "./base-item";
import { SWNRCyberdeckActor } from "./actors/cyberdeck";

declare global {
  namespace TextEditor {
    interface Options {
      height: number;
    }
  }
  interface DocumentClassConfig {
    Actor:
      | typeof SWNRCharacterActor
      | typeof SWNRNPCActor
      | typeof SWNRShipActor
      | typeof SWNRMechActor
      | typeof SWNRVehicleActor
      | typeof SWNRDroneActor
      | typeof SWNRFactionActor
      | typeof SWNRCyberdeckActor;

    Item: typeof SWNRBaseItem;
  }
  interface LenientGlobalVariableTypes {
    game: true;
  }
  namespace ClientSettings {
    interface Values {
      "swnr.systemMigrationVersion": VersionString;
    }
  }
}
