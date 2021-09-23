

export const HULL_DATA = {
  "strikeFighter": {
    data: {
      "shipClass": "fighter",
      "health": {
        "value": 8,
        "max": 8
      },
      "ac": 16,
      "armor": { "value": 5, "max": 5 },
      "mass": {
        "value": 2,
        "max": 2
      },
      "power": {
        "value": 5,
        "max": 5
      },
      "hardpoints": {
        "value": 1,
        "max": 1
      },
      "crew": {
        "min": 1,
        "max": 1,
        "current": 0,
      },
      "speed": 5,
      "cost": 200000,
    }
  },
  "shuttle": {
    data: {
      "shipClass": "fighter",
      "health": {
        "value": 15,
        "max": 15
      },
      "ac": 11,
      "armor": { "value": 0, "max": 0 },
      "mass": {
        "value": 5,
        "max": 5
      },
      "power": {
        "value": 3,
        "max": 3
      },
      "hardpoints": {
        "value": 1,
        "max": 1
      },
      "crew": {
        "min": 1,
        "max": 10,
        "current": 0,
      },
      "speed": 3,
      "cost": 200000,
    }
  },
  "freeMerchant": {
    data: {
      "shipClass": "frigate",
      "health": {
        "value": 20,
        "max": 20
      },
      "ac": 14,
      "armor": { "value": 2, "max": 2 },
      "mass": {
        "value": 15,
        "max": 15
      },
      "power": {
        "value": 10,
        "max": 10
      },
      "hardpoints": {
        "value": 2,
        "max": 2
      },
      "crew": {
        "min": 1,
        "max": 6,
        "current": 0,
      },
      "speed": 3,
      "cost": 500000,
    }
  },
  "patrolBoat": {
    data: {
      "shipClass": "frigate",
      "health": {
        "value": 25,
        "max": 25
      },
      "ac": 14,
      "armor": { "value": 5, "max": 5 },
      "mass": {
        "value": 10,
        "max": 10
      },
      "power": {
        "value": 15,
        "max": 15
      },
      "hardpoints": {
        "value": 4,
        "max": 4
      },
      "crew": {
        "min": 5,
        "max": 20,
        "current": 0,
      },
      "speed": 4,
      "cost": 2500000,
    }
  },
  "corvette": {
    data: {
      "shipClass": "frigate",
      "health": {
        "value": 40,
        "max": 40
      },
      "ac": 13,
      "armor": { "value": 10, "max": 10 },
      "mass": {
        "value": 15,
        "max": 15
      },
      "power": {
        "value": 15,
        "max": 15
      },
      "hardpoints": {
        "value": 6,
        "max": 6
      },
      "crew": {
        "min": 10,
        "max": 40,
        "current": 0,
      },
      "speed": 0,
      "cost": 4000000,
    }
  },
  "heavyFrigate": {
    data: {
      "shipClass": "frigate",
      "health": {
        "value": 50,
        "max": 50
      },
      "ac": 15,
      "armor": { "value": 10, "max": 10 },
      "mass": {
        "value": 20,
        "max": 20
      },
      "power": {
        "value": 25,
        "max": 25
      },
      "hardpoints": {
        "value": 8,
        "max": 8
      },
      "crew": {
        "min": 30,
        "max": 120,
        "current": 0,
      },
      "speed": 1,
      "cost": 7000000,
    }
  },
  "bulkFreighter": {
    data: {
      "shipClass": "cruiser",
      "health": {
        "value": 40,
        "max": 40
      },
      "ac": 11,
      "armor": { "value": 0, "max": 0 },
      "mass": {
        "value": 25,
        "max": 25
      },
      "power": {
        "value": 15,
        "max": 15
      },
      "hardpoints": {
        "value": 2,
        "max": 2
      },
      "crew": {
        "min": 10,
        "max": 40,
        "current": 0,
      },
      "speed": 0,
      "cost": 5000000,
    }
  },
  "fleetCruiser": {
    data: {
      "shipClass": "cruiser",
      "health": {
        "value": 60,
        "max": 60
      },
      "ac": 14,
      "armor": { "value": 15, "max": 15 },
      "mass": {
        "value": 30,
        "max": 30
      },
      "power": {
        "value": 50,
        "max": 50
      },
      "hardpoints": {
        "value": 10,
        "max": 10
      },
      "crew": {
        "min": 50,
        "max": 200,
        "current": 0,
      },
      "speed": 1,
      "cost": 10000000,
    }
  },
  "battleship": {
    data: {
      "shipClass": "capital",
      "health": {
        "value": 100,
        "max": 100
      },
      "ac": 16,
      "armor": { "value": 20, "max": 20 },
      "mass": {
        "value": 50,
        "max": 50
      },
      "power": {
        "value": 75,
        "max": 75
      },
      "hardpoints": {
        "value": 15,
        "max": 15
      },
      "crew": {
        "min": 200,
        "max": 1000,
        "current": 0,
      },
      "speed": 0,
      "cost": 50000000,
    }
  },
  "carrier": {
    data: {
      "shipClass": "capital",
      "health": {
        "value": 75,
        "max": 75
      },
      "ac": 14,
      "armor": { "value": 10, "max": 10 },
      "mass": {
        "value": 100,
        "max": 100
      },
      "power": {
        "value": 50,
        "max": 50
      },
      "hardpoints": {
        "value": 4,
        "max": 4
      },
      "crew": {
        "min": 300,
        "max": 1500,
        "current": 0,
      },
      "speed": 0,
      "cost": 60000000,
    }
  },
  "smallStation": {
    data: {
      "shipClass": "cruiser",
      "health": {
        "value": 120,
        "max": 120
      },
      "ac": 11,
      "armor": { "value": 5, "max": 5 },
      "mass": {
        "value": 40,
        "max": 40
      },
      "power": {
        "value": 50,
        "max": 50
      },
      "hardpoints": {
        "value": 10,
        "max": 10
      },
      "crew": {
        "min": 20,
        "max": 200,
        "current": 0,
      },
      "speed": 0,
      "cost": 5000000,
    }
  },
  "largeStation": {
    data: {
      "shipClass": "capital",
      "health": {
        "value": 120,
        "max": 120
      },
      "ac": 17,
      "armor": { "value": 20, "max": 20 },
      "mass": {
        "value": 75,
        "max": 75
      },
      "power": {
        "value": 125,
        "max": 125
      },
      "hardpoints": {
        "value": 30,
        "max": 30
      },
      "crew": {
        "min": 100,
        "max": 1000,
        "current": 0,
      },
      "speed": 0,
      "cost": 40000000,
    }
  },
};


export const document = HULL_DATA;
export const name = "HULL_DATA";
