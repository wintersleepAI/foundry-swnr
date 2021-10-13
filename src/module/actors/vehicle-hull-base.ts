export const DRONE_MODEL_DATA = {
  primitiveDrone: {
    data: {
      cost: 250,
      fittings: {
        max: 1,
      },
      ac: 12,
      enc: 2,
      health: {
        value: 1,
        max: 1,
      },
      range: "500m",
      tl: 3,
    },
  },
  voidHawk: {
    data: {
      cost: 5000,
      fittings: {
        max: 4,
      },
      ac: 14,
      enc: 6,
      health: {
        value: 15,
        max: 15,
      },
      range: "100km",
      tl: 4,
    },
  },
  stalker: {
    data: {
      cost: 1000,
      fittings: {
        max: 3,
      },
      ac: 13,
      enc: 2,
      health: {
        value: 5,
        max: 5,
      },
      range: "2km",
      tl: 4,
    },
  },
  cuttlefish: {
    data: {
      cost: 2000,
      fittings: {
        max: 5,
      },
      ac: 13,
      enc: 2,
      health: {
        value: 10,
        max: 10,
      },
      range: "1km",
      tl: 4,
    },
  },
  ghostwalker: {
    data: {
      cost: 3000,
      fittings: {
        max: 2,
      },
      ac: 15,
      enc: 3,
      health: {
        value: 1,
        max: 1,
      },
      range: "5km",
      tl: 4,
    },
  },
  sleeper: {
    data: {
      cost: 2500,
      fittings: {
        max: 4,
      },
      ac: 12,
      enc: 2,
      health: {
        value: 8,
        max: 8,
      },
      range: "100km",
      tl: 4,
    },
  },
  pax: {
    data: {
      cost: 10000,
      fittings: {
        max: 4,
      },
      ac: 16,
      enc: 4,
      health: {
        value: 20,
        max: 20,
      },
      range: "100km",
      tl: 5,
    },
  },
  alecto: {
    data: {
      cost: 50000,
      fittings: {
        max: 4,
      },
      ac: 18,
      enc: 4,
      health: {
        value: 30,
        max: 30,
      },
      range: "5000km",
      tl: 5,
    },
  },
};

export const HULL_DATA = {
  strikeFighter: {
    data: {
      shipClass: "fighter",
      health: {
        value: 8,
        max: 8,
      },
      ac: 16,
      armor: { value: 5, max: 5 },
      mass: {
        value: 2,
        max: 2,
      },
      power: {
        value: 5,
        max: 5,
      },
      hardpoints: {
        value: 1,
        max: 1,
      },
      crew: {
        min: 1,
        max: 1,
        current: 0,
      },
      lifeSupportDays: {
        value: 60,
        max: 60,
      },
      speed: 5,
      cost: 200000,
    },
  },
  shuttle: {
    data: {
      shipClass: "fighter",
      health: {
        value: 15,
        max: 15,
      },
      ac: 11,
      armor: { value: 0, max: 0 },
      mass: {
        value: 5,
        max: 5,
      },
      power: {
        value: 3,
        max: 3,
      },
      hardpoints: {
        value: 1,
        max: 1,
      },
      crew: {
        min: 1,
        max: 10,
        current: 0,
      },
      lifeSupportDays: {
        value: 600,
        max: 600,
      },
      speed: 3,
      cost: 200000,
    },
  },
  freeMerchant: {
    data: {
      shipClass: "frigate",
      health: {
        value: 20,
        max: 20,
      },
      ac: 14,
      armor: { value: 2, max: 2 },
      mass: {
        value: 15,
        max: 15,
      },
      power: {
        value: 10,
        max: 10,
      },
      hardpoints: {
        value: 2,
        max: 2,
      },
      crew: {
        min: 1,
        max: 6,
        current: 0,
      },
      lifeSupportDays: {
        value: 360,
        max: 360,
      },
      speed: 3,
      cost: 500000,
    },
  },
  patrolBoat: {
    data: {
      shipClass: "frigate",
      health: {
        value: 25,
        max: 25,
      },
      ac: 14,
      armor: { value: 5, max: 5 },
      mass: {
        value: 10,
        max: 10,
      },
      power: {
        value: 15,
        max: 15,
      },
      hardpoints: {
        value: 4,
        max: 4,
      },
      crew: {
        min: 5,
        max: 20,
        current: 0,
      },
      lifeSupportDays: {
        value: 1200,
        max: 1200,
      },
      speed: 4,
      cost: 2500000,
    },
  },
  corvette: {
    data: {
      shipClass: "frigate",
      health: {
        value: 40,
        max: 40,
      },
      ac: 13,
      armor: { value: 10, max: 10 },
      mass: {
        value: 15,
        max: 15,
      },
      power: {
        value: 15,
        max: 15,
      },
      hardpoints: {
        value: 6,
        max: 6,
      },
      crew: {
        min: 10,
        max: 40,
        current: 0,
      },
      lifeSupportDays: {
        value: 2400,
        max: 2400,
      },
      speed: 0,
      cost: 4000000,
    },
  },
  heavyFrigate: {
    data: {
      shipClass: "frigate",
      health: {
        value: 50,
        max: 50,
      },
      ac: 15,
      armor: { value: 10, max: 10 },
      mass: {
        value: 20,
        max: 20,
      },
      power: {
        value: 25,
        max: 25,
      },
      hardpoints: {
        value: 8,
        max: 8,
      },
      crew: {
        min: 30,
        max: 120,
        current: 0,
      },
      lifeSupportDays: {
        value: 73200,
        max: 73200,
      },
      speed: 1,
      cost: 7000000,
    },
  },
  bulkFreighter: {
    data: {
      shipClass: "cruiser",
      health: {
        value: 40,
        max: 40,
      },
      ac: 11,
      armor: { value: 0, max: 0 },
      mass: {
        value: 25,
        max: 25,
      },
      power: {
        value: 15,
        max: 15,
      },
      hardpoints: {
        value: 2,
        max: 2,
      },
      crew: {
        min: 10,
        max: 40,
        current: 0,
      },
      lifeSupportDays: {
        value: 2400,
        max: 2400,
      },
      speed: 0,
      cost: 5000000,
    },
  },
  fleetCruiser: {
    data: {
      shipClass: "cruiser",
      health: {
        value: 60,
        max: 60,
      },
      ac: 14,
      armor: { value: 15, max: 15 },
      mass: {
        value: 30,
        max: 30,
      },
      power: {
        value: 50,
        max: 50,
      },
      hardpoints: {
        value: 10,
        max: 10,
      },
      crew: {
        min: 50,
        max: 200,
        current: 0,
      },
      lifeSupportDays: {
        value: 12000,
        max: 12000,
      },
      speed: 1,
      cost: 10000000,
    },
  },
  battleship: {
    data: {
      shipClass: "capital",
      health: {
        value: 100,
        max: 100,
      },
      ac: 16,
      armor: { value: 20, max: 20 },
      mass: {
        value: 50,
        max: 50,
      },
      power: {
        value: 75,
        max: 75,
      },
      hardpoints: {
        value: 15,
        max: 15,
      },
      crew: {
        min: 200,
        max: 1000,
        current: 0,
      },
      lifeSupportDays: {
        value: 60000,
        max: 60000,
      },
      speed: 0,
      cost: 50000000,
    },
  },
  carrier: {
    data: {
      shipClass: "capital",
      health: {
        value: 75,
        max: 75,
      },
      ac: 14,
      armor: { value: 10, max: 10 },
      mass: {
        value: 100,
        max: 100,
      },
      power: {
        value: 50,
        max: 50,
      },
      hardpoints: {
        value: 4,
        max: 4,
      },
      crew: {
        min: 300,
        max: 1500,
        current: 0,
      },
      lifeSupportDays: {
        value: 90000,
        max: 90000,
      },
      speed: 0,
      cost: 60000000,
    },
  },
  smallStation: {
    data: {
      shipClass: "cruiser",
      health: {
        value: 120,
        max: 120,
      },
      ac: 11,
      armor: { value: 5, max: 5 },
      mass: {
        value: 40,
        max: 40,
      },
      power: {
        value: 50,
        max: 50,
      },
      hardpoints: {
        value: 10,
        max: 10,
      },
      crew: {
        min: 20,
        max: 200,
        current: 0,
      },
      lifeSupportDays: {
        value: 12000,
        max: 12000,
      },
      speed: 0,
      cost: 5000000,
    },
  },
  largeStation: {
    data: {
      shipClass: "capital",
      health: {
        value: 120,
        max: 120,
      },
      ac: 17,
      armor: { value: 20, max: 20 },
      mass: {
        value: 75,
        max: 75,
      },
      power: {
        value: 125,
        max: 125,
      },
      hardpoints: {
        value: 30,
        max: 30,
      },
      crew: {
        min: 100,
        max: 1000,
        current: 0,
      },
      lifeSupportDays: {
        value: 60000,
        max: 60000,
      },
      speed: 0,
      cost: 40000000,
    },
  },
};

export const document = HULL_DATA;
export const name = "HULL_DATA";
