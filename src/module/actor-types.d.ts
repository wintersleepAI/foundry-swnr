import { SWNRArmorTypes, AllItemClasses, ItemTypes } from "./item-types";
import { SWNRFactionAsset } from "./items/asset";
import { SWNRBaseItem } from "./base-item";

type ActorTypes =
  | "character"
  | "npc"
  | "ship"
  | "mech"
  | "drone"
  | "vehicle"
  | "faction";

declare type SWNRStats = "str" | "dex" | "con" | "int" | "wis" | "cha";

type SWNRMechClass = "suit" | "light" | "heavy";
type SWNRShipClass = "fighter" | "frigate" | "cruiser" | "capital";
type SWNRVehicleClass = "s" | "m" | "l";

type SWNRAllVehicleClasses =
  | ""
  | SWNRMechClass
  | SWNRShipClass
  | SWNRVehicleClass;

type SWNRShipHullType =
  | "strikeFighter"
  | "shuttle"
  | "freeMerchant"
  | "patrolBoat"
  | "corvette"
  | "heavyFrigate"
  | "bulkFreighter"
  | "fleetCruiser"
  | "battleship"
  | "carrier"
  | "smallStation"
  | "largeStation";

type FactionRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

declare interface SWNRStatBase {
  base: number;
  bonus: number;
  boost: number;
}
declare interface SWNRStatComputed {
  mod: number;
  total: number;
}
declare interface SWNRLivingTemplateBase {
  health: {
    value: number;
    max: number;
  };
  baseAc: number; //computed-active effects needed
  ac: number;
  ab: number;
  systemStrain: {
    value: number;
    permanent: number; //computed-active effects needed
  };
  effort: {
    bonus: number;
    current: number;
    scene: number;
    day: number;
  };
}

declare interface SWNRVehicleTemplateBase {
  cost: number;
  health: {
    value: number;
    max: number;
  };
  armor: {
    value: number;
    max: number;
  };
  speed: number;
  ac: number;
  crew: {
    min: number;
    max: number;
    current: number;
  };
  crewMembers: string[];
  tl: number;
  description: string;
  mods: string;
}

declare interface SWNRLivingTemplateComputed {
  baseAc: number; //computed-active effects needed
  systemStrain: {
    max: number;
    permanent: number;
    cyberware: number;
  };

  effort: {
    max: number;
    value: number;
  };

  tweak: {
    extraEffort: {
      value: number;
    };
  };
}
declare interface SWNREncumbranceTemplateBase {
  encumbrance: {
    [key in "stowed" | "ready"]: { value: number };
  };
}
declare interface SWNREncumbranceTemplateComputed {
  encumbrance: {
    [key in "stowed" | "ready"]: { max: number };
  };
}

declare interface SWNRResource {
  name: string;
  value: number;
  max: number;
}
declare interface SWNRCharacterBaseData
  extends SWNRLivingTemplateBase,
    SWNREncumbranceTemplateBase {
  level: { value: number; exp: number };
  stats: { [key in SWNRStats]: SWNRStatBase };
  goals: string[];
  class: string;
  species: string;
  homeworld: string;
  background: string;
  employer: string;
  biography: string;
  credits: {
    debt: number;
    balance: number;
    owed: number;
  };
  unspentSkillPoints: number;
  unspentPsySkillPoints: number;
  tweak: {
    advInit: boolean;
    quickSkill1: string;
    quickSkill2: string;
    quickSkill3: string;
    extraEffortName: string;
    extraEffort: {
      bonus: number;
      current: number;
      scene: number;
      day: number;
      max: number;
    };
    showResourceList: boolean;
    resourceList: SWNRResource[];
  };
}

declare interface SWNRCharacterComputedData
  extends SWNRLivingTemplateComputed,
    SWNREncumbranceTemplateComputed {
  itemTypes: {
    //todo: make a better type
    [type in Exclude<ItemTypes, "modItem" | "modShip">]: (AllItemClasses & {
      type: type;
    })[];
    // class: SWNRBaseItem<any>[];
    // armor: SWNRBaseItem<"armor">[];
    // weapon: SWNRBaseItem<"weapon">[];
    // background: SWNRBaseItem<any>[];
    // power: SWNRBaseItem<any>[];
    // focus: SWNRBaseItem<any>[];
    // item: SWNRBaseItem<"item">[];
    // modItem: SWNRBaseItem<any>[];
    // modShip: SWNRBaseItem<any>[];
    // skill: SWNRBaseItem<"skill">[];
  };

  save: {
    physical?: number;
    evasion?: number;
    mental?: number;
    luck?: number;
  };
  stats: { [key in SWNRStats]: SWNRStatComputed };
}

declare interface SWNRTag {
  name: string;
  desc: string;
  effect: string;
}

declare interface SWNRFactionData {
  description: string;
  health: {
    value: number;
  };
  active: boolean;
  forceRating: FactionRating;
  cunningRating: FactionRating;
  wealthRating: FactionRating;
  facCreds: number;
  xp: number;
  homeworld: string;
  tags: SWNRTag[];
  factionGoal: string;
  factionGoalDesc: string;
  log: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
declare interface SWNRFactionComputed {
  cunningAssets: SWNRBaseItem<"asset">[];
  wealthAssets: SWNRBaseItem<"asset">[];
  forceAssets: SWNRBaseItem<"asset">[];
  health: {
    max: number;
  };
}

declare interface SWNRShipComputed {
  power: {
    value: number;
  };
  mass: {
    value: number;
  };
  hardpoints: {
    value: number;
  };
}

declare interface SWNRMechComputed {
  power: {
    value: number;
  };
  mass: {
    value: number;
  };
  hardpoints: {
    value: number;
  };
}

declare interface SWNRVehicleData extends SWNRVehicleTemplateBase {
  kmph: number;
  power: {
    max: number;
  };
  mass: {
    max: number;
  };
  hardpoints: {
    max: number;
  };
  tonnage: number;
  size: "s" | "m" | "l";
}

declare interface SWNRVehicleComputed {
  power: {
    value: number;
  };
  mass: {
    value: number;
  };
  hardpoints: {
    value: number;
  };
}

declare interface SWNRDroneComputed {
  fittings: {
    value: number;
  };
}

declare interface SWNRDroneData extends SWNRVehicleTemplateBase {
  fittings: {
    max: number;
  };
  enc: number;
  range: string;
  model: string;
}

declare interface SWNRMechData extends SWNRVehicleTemplateBase {
  itemTypes: {
    //todo: make a better type
    [type in Exclude<
      ItemTypes,
      "focus" | "skill" | "weapon" | "armor" | "power"
    >]: (AllItemClasses & {
      type: type;
    })[];
  };
  power: {
    max: number;
  };
  mass: {
    max: number;
  };
  hardpoints: {
    max: number;
  };
  maintenanceCost: number;
  mechClass: SWNRMechClass;
  mechHullType: string;
}

declare interface SWNRShipData extends SWNRVehicleTemplateBase {
  itemTypes: {
    //todo: make a better type
    [type in Exclude<
      ItemTypes,
      "focus" | "skill" | "weapon" | "armor" | "power"
    >]: (AllItemClasses & {
      type: type;
    })[];
  };
  power: {
    max: number;
  };
  mass: {
    max: number;
  };
  hardpoints: {
    max: number;
  };
  lifeSupportDays: {
    value: number;
    max: number;
  };
  fuel: {
    value: number;
    max: number;
  };
  cargo: {
    value: number;
    max: number;
  };
  spikeDrive: {
    value: number;
    max: number;
  };
  shipClass: SWNRShipClass;
  shipHullType: SWNRShipHullType;
  operatingCost: number;
  maintenanceCost: number;
  amountOwed: number;
  paymentAmount: number;
  paymentMonths: number;
  maintenanceMonths: number;
  creditPool;
  lastMaintenance: {
    year: number;
    month: number;
    day: number;
  };
  lastPayment: {
    year: number;
    month: number;
    day: number;
  };
  roles: {
    captain: string;
    gunnery: string;
    bridge: string;
    engineering: string;
    comms: string;
  };
  cargoCarried: SWNRResource[];
  commandPoints: number;
  npcCommandPoints: number;
  crewSkillBonus: number;
  actionsTaken: string[];
  supportingDept: string;
  roleOrder: string[];
}

declare interface SWNRNPCData extends SWNRLivingTemplateBase {
  armorType: SWNRArmorTypes;
  skillBonus: number;
  attacks: {
    baseAttack: string;
    damage: string;
    bonusDamage: number;
    number: number;
  };
  hitDice: number;
  saves: number;
  speed: number;
  moralScore: number;
  reaction:
    | "unknown"
    | "hostile"
    | "negative"
    | "neutral"
    | "positive"
    | "friendly";
  homeworld: string;
  faction: string;
  notes: {
    [key in "left" | "right"]: {
      label: string;
      contents: string;
    };
  };
}
interface PCActorSource {
  type: "character";
  data: Merge<SWNRCharacterBaseData, SWNRCharacterComputedData>;
}
declare global {
  interface DataConfig {
    Actor:
      | PCActorSource
      | { type: "npc"; data: Merge<SWNRNPCData, SWNRLivingTemplateComputed> }
      | { type: "ship"; data: Merge<SWNRShipData, SWNRShipComputed> }
      | { type: "mech"; data: Merge<SWNRMechData, SWNRMechComputed> }
      | { type: "drone"; data: Merge<SWNRDroneData, SWNRDroneComputed> }
      | { type: "vehicle"; data: Merge<SWNRVehicleData, SWNRVehicleComputed> }
      | { type: "faction"; data: Merge<SWNRFactionData, SWNRFactionComputed> };
  }
  interface SourceConfig {
    Actor:
      | { type: "character"; data: SWNRCharacterBaseData }
      | { type: "npc"; data: SWNRNPCData }
      | { type: "ship"; data: SWNRShipData }
      | { type: "mech"; data: SWNRMechData }
      | { type: "drone"; data: SWNRDroneData }
      | { type: "vehicle"; data: SWNRVehicleData }
      | { type: "faction"; data: SWNRFactionData };
  }
}
