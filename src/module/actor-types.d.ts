import { SWNRArmorTypes, AllItemClasses, ItemTypes } from "./item-types";

type ActorTypes = "character" | "npc" | "ship";

declare type SWNRStats = "str" | "dex" | "con" | "int" | "wis" | "cha";

type SWNRShipClass = "fighter" | "frigate" | "cruiser" | "capital";
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
    };
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
  description: string;
  mods: string;
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
      | { type: "ship"; data: Merge<SWNRShipData, SWNRShipComputed> };
  }
  interface SourceConfig {
    Actor:
      | { type: "character"; data: SWNRCharacterBaseData }
      | { type: "npc"; data: SWNRNPCData }
      | { type: "ship"; data: SWNRShipData };
  }
}
