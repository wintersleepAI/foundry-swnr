import { SWNRBaseActor } from "../base-actor";
import { SWNRBaseItem } from "../base-item";

const HEALTH__XP_TABLE = {
  1: 1,
  2: 2,
  3: 4,
  4: 6,
  5: 9,
  6: 12,
  7: 16,
  8: 20,
};

export class SWNRFactionActor extends SWNRBaseActor<"faction"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async _preCreate(actorDataConstructorData, options, user): Promise<void> {
    await super._preCreate(actorDataConstructorData, options, user);
    if (
      actorDataConstructorData.type &&
      this.data._source.img == "icons/svg/mystery-man.svg"
    ) {
      const img = "systems/swnr/assets/icons/faction.png";
      this.data._source.img = img;
    }
  }

  getHealth(level: number): number {
    if (level in HEALTH__XP_TABLE) {
      return HEALTH__XP_TABLE[level];
    } else {
      return 0;
    }
  }

  async logMessage(
    title: string,
    content: string,
    longContent: string | null = null,
    logRoll: Roll | null = null
  ): Promise<void> {
    const gm_ids: string[] = ChatMessage.getWhisperRecipients("GM")
      .filter((i) => i)
      .map((i) => i.id)
      .filter((i): i is string => i !== null);

    const cardData = {
      title,
      content,
      longContent,
      logRoll,
    };
    if (logRoll) {
      await logRoll.roll({ async: true });
      cardData["roll"] = await logRoll.render();
    }
    const template = "systems/swnr/templates/chat/faction-log.html";

    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: await renderTemplate(template, cardData),
      type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
      whisper: gm_ids,
    };
    ChatMessage.create(chatData);
  }

  async addTag(name: string): Promise<void> {
    const match = FACTION_TAGS.filter((i) => i.name == name);
    if (!match) {
      ui.notifications?.error(`Error unable to find tag ${name}`);
      return;
    }
    const tags = this.data.data.tags;
    tags.push(match[0]);
    await this.update({
      data: {
        tags: tags,
      },
    });
  }

  async addBase(
    hp: number,
    assetType: string,
    name: string,
    imgPath: string | null
  ): Promise<void> {
    if (hp > this.data.data.health.max) {
      ui.notifications?.error(
        `Error HP of new base (${hp}) cannot be greater than faction max HP (${this.data.data.health.max})`
      );
      return;
    }
    if (hp > this.data.data.facCreds) {
      ui.notifications?.error(
        `Error HP of new base (${hp}) cannot be greater than facCred  (${this.data.data.facCreds})`
      );
      return;
    }
    const newFacCreds = this.data.data.facCreds - hp;
    await this.update({ data: { facCreds: newFacCreds } });
    await this.createEmbeddedDocuments(
      "Item",
      [
        {
          name: name,
          type: "asset",
          img: imgPath,
          data: {
            assetType: assetType,
            health: {
              value: hp,
              max: hp,
            },
            baseOfInfluence: true,
          },
        },
      ],
      {}
    );
  }

  async startTurn(): Promise<void> {
    /*
    At the beginning of each turn, a faction gains Fac-
    Creds equal to half their Wealth rating rounded up plus
    one-quarter of their total Force and Cunning ratings,
    rounded down. Any maintenance costs must be paid
    at the beginning of each turn. Assets that cannot be
    maintained are unusable; an asset that goes without
    maintenance for two consecutive rounds is lost. A fac-
    tion cannot voluntarily choose not to pay maintenance.
    If a faction has no goal at the start of a turn, they
    may pick a new one. If they wish to abandon a prior
    goal, they may do so, but the demoralization and con-
    fusion costs them that turn`s FacCred income and they
    may perform no other action that turn.
    */

    const assets = <SWNRBaseItem<"asset">[]>(
      this.items.filter((i) => i.type === "asset")
    );
    const wealthIncome = Math.ceil(this.data.data.wealthRating / 2);
    const cunningIncome = Math.floor(this.data.data.cunningRating / 4);
    const forceIncome = Math.floor(this.data.data.forceRating / 4);
    const assetIncome = assets
      .map((i) => i.data.data.income)
      .reduce((i, n) => i + n, 0);
    const assetWithMaint = assets.filter((i) => i.data.data.maintenance);
    const assetMaintTotal = assetWithMaint
      .map((i) => i.data.data.maintenance)
      .reduce((i, n) => i + n, 0);

    const cunningAssetsOverLimit = Math.min(
      this.data.data.cunningRating - this.data.data.cunningAssets.length,
      0
    );
    const forceAssetsOverLimit = Math.min(
      this.data.data.forceRating - this.data.data.forceAssets.length,
      0
    );
    const wealthAssetsOverLimit = Math.min(
      this.data.data.wealthRating - this.data.data.wealthAssets.length,
      0
    );
    const costFromAssetsOver =
      cunningAssetsOverLimit + forceAssetsOverLimit + wealthAssetsOverLimit;
    const income =
      wealthIncome +
      cunningIncome +
      forceIncome +
      assetIncome -
      assetMaintTotal -
      costFromAssetsOver;
    let new_creds = this.data.data.facCreds + income;
    let msg = `Income this round: ${income}.<br>From assets: ${assetIncome}.<br>Maintenance -${assetMaintTotal}.<br>Cost from assets over rating -${costFromAssetsOver}.<br>`;
    if (income < 0) {
      msg += ` <b>Loosing FacCreds this turn.</b><br>`;
    }
    const aitems: Record<string, unknown>[] = [];

    if (new_creds < 0) {
      if (assetMaintTotal + new_creds < 0) {
        //Marking all assets unusable would still not bring money above, can mark all w/maint as unusable.
        for (let i = 0; i < assetWithMaint.length; i++) {
          const asset = assetWithMaint[i];
          const assetCost = asset.data.data.maintenance;
          new_creds += assetCost; // return the money
          aitems.push({ _id: asset.id, data: { unusable: true } });
        }
        if (aitems.length > 0) {
          await this.updateEmbeddedDocuments("Item", aitems);
        }
        msg += ` <b>Out of money and unable to pay for all assets</b>, marking all assets with maintenance as unusable`;
      } else {
        msg += ` <b>Out of money and unable to pay for all assets</b>, need to make assets unusable. Mark unusable for assets to cover facCreds: ${income}`;
      }
    }
    await this.update({ data: { facCreds: new_creds } });
    const title = `New Turn for ${this.name}`;
    await this.logMessage(title, msg);
  }

  async setGoal(): Promise<void> {
    ui.notifications?.info("set goal");
  }

  async ratingUp(type: string): Promise<void> {
    const ratingName = `${type}Rating`;
    let ratingLevel = this.data.data[ratingName];
    if (ratingLevel == 8) {
      ui.notifications?.info("Rating is already at max");
      return;
    }
    if (!ratingLevel) {
      ratingLevel = 0;
    }
    const targetLevel = parseInt(ratingLevel) + 1;
    let xp = this.data.data.xp;
    if (targetLevel in HEALTH__XP_TABLE) {
      const req_xp = HEALTH__XP_TABLE[targetLevel];
      if (req_xp > xp) {
        ui.notifications?.error(
          `Not enough XP to raise rating. Have ${xp} Need ${req_xp}`
        );
        return;
      }
      xp -= req_xp;
      if (type == "cunning") {
        await this.update({
          "data.xp": xp,
          "data.cunningRating": targetLevel,
        });
      } else if (type == "force") {
        await this.update({
          "data.xp": xp,
          "data.forceRating": targetLevel,
        });
      } else if (type == "wealth") {
        await this.update({
          "data.xp": xp,
          "data.wealthRating": targetLevel,
        });
      }
      ui.notifications?.info(
        `Raised ${type} rating to ${targetLevel} using ${xp} xp`
      );
    }
  }

  async setHomeWorld(journalId: string): Promise<void> {
    const journal = game.journal?.get(journalId);
    if (!journal || !journal.name) {
      ui.notifications?.error("Cannot find journal");
      return;
    }
    const performHome: boolean = await new Promise((resolve) => {
      Dialog.confirm({
        title: game.i18n.format("swnr.sheet.faction.setHomeworld", {
          name: journal.name,
        }),
        yes: () => resolve(true),
        no: () => resolve(false),
        content: game.i18n.format("swnr.sheet.faction.setHomeworld", {
          name: journal.name,
        }),
      });
    });
    if (!performHome) {
      return;
    }
    ui.notifications?.error("TODO create asset base with max health.");
    await this.update({ data: { homeworld: journal.name } });
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    const assets = <SWNRBaseItem<"asset">[]>(
      this.items.filter((i) => i.type == "asset")
    );
    const cunningAssets: Array<SWNRBaseItem<"asset">> = assets.filter(
      (i: SWNRBaseItem<"asset">) => i.data.data["assetType"] === "cunning"
    );
    const forceAssets: Array<SWNRBaseItem<"asset">> = assets.filter(
      (i: SWNRBaseItem<"asset">) => i.data.data["assetType"] === "force"
    );
    const wealthAssets: Array<SWNRBaseItem<"asset">> = assets.filter(
      (i: SWNRBaseItem<"asset">) => i.data.data["assetType"] === "wealth"
    );

    data.cunningAssets = cunningAssets;
    data.forceAssets = forceAssets;
    data.wealthAssets = wealthAssets;

    data.health.max =
      4 +
      this.getHealth(data.wealthRating) +
      this.getHealth(data.forceRating) +
      this.getHealth(data.cunningRating);
  }
}

export const document = SWNRFactionActor;
export const name = "faction";
export const FACTION_GOALS = [
  {
    name: "Military Conquest",
    desc:
      "Destroy a number of Force assets of rival factions equal to your faction`s Force rating. Difficulty is 1/2 number of assets destroyed.",
  },
  {
    name: "Commercial Expansion",
    desc:
      "Destroy a number of Wealth assets of rival factions equal to your faction`s Wealth rating. Difficulty is 1/2 number of assets destroyed.",
  },
  {
    name: "Intelligence Coup",
    desc:
      "Destroy a number of Cunning assets of rival factions equal to your faction`s Cunning rating. Difficulty is 1/2 number of assets destroyed.",
  },
  {
    name: "Planetary Seizure",
    desc:
      "Take control of a planet, becoming the legitimate planetary government. Difficulty equal to half the average of the current ruling faction`s Force, Cunning, and Wealth ratings. If the planet somehow lacks any opposing faction to resist the seizure, it counts as Difficulty 1.",
  },
  {
    name: "Expand Influence",
    desc:
      "Plant a Base of Influence on a new planet. Difficulty 1, +1 if the attempt is contested by a rival faction.",
  },
  {
    name: "Blood the Enemy",
    desc:
      "Inflict a number of hit points of damage on enemy faction assets or bases equal to your faction`s total Force, Cunning, and Wealth ratings. Difficulty 2.",
  },
  {
    name: "Peaceable Kingdom",
    desc: "Don`t take an Attack action for four turns. Difficulty 1.",
  },
  {
    name: "Destroy the Foe",
    desc:
      "Destroy a rival faction. Difficulty equal to 1 plus the average of the faction`s Force, Cunning, and Wealth ratings.",
  },
  {
    name: "Inside Enemy Territory",
    desc:
      "Have a number of stealthed assets on worlds with other planetary governments equal to your Cunning score. Units that are already stealthed on worlds when this goal is adopted don`t count. Difficulty 2.",
  },
  {
    name: "Invincible Valor",
    desc:
      "Destroy a Force asset with a minimum purchase rating higher than your faction`s Force rating. Thus, if your Force is 3, you need to destroy a unit that requires Force 4 or higher to purchase. Difficulty 2.",
  },
  {
    name: "Wealth of Worlds",
    desc:
      "Spend FacCreds equal to four times your faction`s Wealth rating on bribes and influence. This money is effectively lost, but the goal is then considered accomplished. The faction`s Wealth rating must increase before this goal can be selected again. Difficulty 2.",
  },
];

export const FACTION_ACTIONS = [
  {
    name: "Attack",
    desc:
      "Attacking is the chief way by which a faction assaults a rival`s assets and organizational structure. A successful attack can damage or destroy an enemy asset, or even damage the leadership and cohesion of an enemy faction. It`s up to the GM or players to describe an attack and its methods.",
    longDesc:
      "Attacks can only be launched against known assets. If a rival has stealthed assets on a world, they cannot be targeted for an attack until they`ve been discovered by a faction`s intelligence agents. Attacks can only be launched against assets on the same world as the attacker. To launch an attack, the attacker selects one or more of their own assets and targets a rival faction with assets on the same world. One at a time, each attacking asset is matched against a defending asset chosen by the defender. Each attacking asset can attack only once per turn, though a defending asset can defend as many times as the defender wishes, assuming it can survive multiple conflicts. Once matched, the attacker rolls 1d10 and adds the relevant attribute for the asset. For example, a military unit`s Attack might add the faction`s Force rating to the attack roll, while a cyberninja unit might add the faction`s Cunning to the attack roll. The defender then rolls 1d10 and adds the attribute that the attack targets. In the instance of the military unit, this might be an attack against Force, causing the defender to add their Force rating to the roll, while defending against the cyberninjas might require adding the defender`s Cunning rating. The Attack line of the attacking asset indicates which attribute to add to the attack roll and which to add to the defense roll. If the attacker`s roll exceeds the defender`s roll, the attack is a success. The defending asset suffers damage as given on the Attack line of the attacking asset. If the defender has a Base of Influence on the world, the defender may opt to let the damage bypass the asset and hit the Base of Influence instead, causing damage to it and the faction hit points. If the asset or Base of Influence is reduced to zero hit points, it is lost. If the attacker`s roll is less than the defender`s roll, the attack fails. The defending asset can apply whatever damage their Counterattack line indicates to the attacking asset. If the defending asset has no Counterattack line, the attacker suffers no consequences for the failed attack. A tie on the roll results in both Attack and Counterattack succeeding. Both attacker and defender take damage as indicated.",
  },
  {
    name: "Buy Asset",
    desc:
      "The faction buys one asset on their homeworld or another planet on which they have a Base of Influence. These assets take time to assemble, and can neither attack, defend, nor grant their special benefits until the beginning of the faction`s next turn. The faction must have a sufficient rating to buy an asset, and the planet must have a tech level sufficient to support the asset`s creation. Only one asset can be purchased by a faction per turn.",
  },
  {
    name: "Change Homeworld",
    desc:
      "A faction can move to a different homeworld, if they have a Base of Influence on the destination planet. This action takes one turn, plus one more for each hex of distance between the old homeworld and the new. During this time the faction can initiate no actions.",
  },
  {
    name: "Expand Influence",
    desc:
      "The faction buys a Base of Influence asset on a planet on which they have at least one other asset. The faction then rolls 1d10+Cunning rating against similar rolls by every other faction on the planet. Any of the others that equal or beat the faction`s roll may make a free immediate Attack action against the Base of Influence if they wish. Other assets present on the planet may defend against the attack as normal. The Base of Influence cannot be used until the beginning of the faction`s next turn.",
    longDesc:
      "To buy a Base of Influence, the purchaser pays one FacCred for every hit point the base has, up to a maximum equal to the faction`s maximum hit points. Bases with few hit points are relatively peripheral outposts, easy to dislodge but cheap to erect. Bases with many hit points are significant strongholds that would hurt the faction badly to lose but are much harder to eliminate. Factions may use this action to buy additional hit points for a Base of Influence, paying one additional FacCred up to the maximum HP allowed. It is possible to decrease a base`s hit points with the action as well, albeit without refunds. The base on a faction`s homeworld cannot be shrunk this way.",
    roll: "1d10 + @cunningRating",
  },
  {
    name: "Refit Asset",
    desc:
      "Change one asset to any other asset of the same type. If the new asset is of a more expensive type, pay the difference. The asset must be on a planet that allows the purchase of the new asset. Turning a militia squad into elite skirmishers requires a tech level 4 world and governmental permission, for example. A refitted asset is unable to attack or defend until the beginning of the faction`s next turn.",
  },
  {
    name: "Repair Asset/Faction",
    desc:
      "Heal damage to an asset or faction. For one FacCred, an asset heals points of damage equal to the faction`s score in its ruling attribute. More damage can be healed in this single action, but the cost of repair increases by one FacCred for each further amount repaired- two FacCreds for the second amount healed, three FacCreds for the third amount healed, et cetera. If used to heal a faction, the faction regains hit points equal to the rounded average of its highest and lowest attribute ratings. This healing cannot be hurried by additional spending. Use of this action allows the faction to heal as many different assets as it wishes.",
  },
  {
    name: "Sell Asset",
    desc: "Gain half the FacCred cost of the asset, rounded down.",
  },
  {
    name: "Seize Planet",
    desc:
      "The faction seeks to become the ruling body of a world. The faction must destroy all unstealthed assets on the planet belonging to factions who oppose their attempt before they can successfully take control. If all the assets cannot be destroyed in one turn, the faction must continue the attempt next turn until either successful or all of their own assets on that planet have been destroyed or have left the planet. No other actions can be taken in the meanwhile. Once all resistance has been crushed, the attacker must maintain at least one unstealthed asset on the world for three turns. If successful, they gain the Planetary Government tag for the world.",
  },
  {
    name: "Use Asset Ability",
    desc:
      "Use the special abilities of one or more assets, such as the transport ability of logistics assets, or the intelligence-gathering abilities of spy assets.",
  },
];

export const FACTION_TAGS = [
  {
    name: "Colonists",
    desc:
      "This faction is a fresh colony on an otherwise largely untouched planet. It is this brave band of pioneers that will tame the world's wild forces and bring forth a better life for those who come after.",
    effect:
      "This faction has all the benefits of the Planetary Government tag for its homeworld, as no other government exists on a fresh colony. The faction's homeworld is also treated as if it had at least tech level 4. Colonies with fewer than 100,000 citizens lack the necessary industrial infrastructure to build Spaceship-type assets.",
  },
  {
    name: "Deep Rooted",
    desc:
      "This faction has been part of a world's life for time out of mind. Most natives can hardly imagine the world without this faction's presence, and the traditional prerogatives and dignities of the group are instinctively respected.",
    effect:
      "This faction can roll one additional d10 when defending against attacks on assets on their homeworld. If the faction ever changes homeworlds, this tag is lost.",
  },
  {
    name: "Eugenics Cult",
    desc:
      "The forbidden maltech secrets of advanced human genetic manipulation are known to this faction, and they use them with gusto. Slave-engineered humanoids and “deathless” leadership are just two of the more common alterations these unstable scientists undertake.",
    effect:
      "Eugenics Cultists can buy the Gengineered Slaves asset; it's an asset requiring Force 1 with the statistics of 6 HP, 2 FacCred cost, tech level 4 required, with an Attack of Force vs. Force/1d6 damage and a Counterattack of 1d4 damage. Once per turn, the Eugenics Cult can roll an extra d10 on an attack or defense by a Gengineered Slaves asset, regardless of the stat being used. Gengineered Slaves can count as either a Military Unit or Special Forces, determined when the cult first creates a specific asset.",
  },
  {
    name: "Exchange Consulate",
    desc:
      "This faction is either led through an Exchange Consulate or has close ties with that pacifistic society of bankers and diplomats. The sophisticated economic services they provide strengthen the faction.",
    effect:
      "When the faction successfully completes a “Peaceable Kingdom” Goal, they may roll 1d6; on a 4+, they gain a bonus experience point. Once per turn, the faction may roll an extra d10 when defending against a Wealth attack.",
  },
  {
    name: "Fanatical",
    desc:
      "The members of this faction just don't know when to quit. No matter how overmatched, the members will keep fighting to the bitter end- and occasionally past it.",
    effect:
      "The faction always rerolls any dice that come up as 1. This zealousness leaves them open at times, however; they always lose ties during attacks.",
  },
  {
    name: "Imperialists",
    desc:
      "This faction nurses wild dreams of controlling the sector, whether out of an impulse to bring their local culture and technology to less fortunate worlds or simple lust for dominion. They excel at defeating planetary defenses and standing armies.",
    effect:
      "This faction may roll an extra d10 for attacks made as part of a Seize Planet action.",
  },
  {
    name: "Machiavellian",
    desc:
      "This faction's meat and drink is intrigue, its members delighting in every opportunity to scheme. It may be a secret cabal of hidden masters or the decadent court of a fallen stellar empire, but its membership has forgotten more of treachery than most others ever learn.",
    effect:
      "Once per turn, this faction can roll an additional d10 when making a Cunning attack.",
  },
  {
    name: "Mercenary Group",
    desc:
      "The faction sells its services to the highest bidder, and is an extremely mobile organization. Vast amounts of men and material can be moved interstellar distances in just a few months.",
    effect:
      "All faction assets gain the following special ability: As an action, the asset may move itself to any world within one hex.",
  },
  {
    name: "Perimeter Agency",
    desc:
      "This faction is or is closely tied to an Agency of the enigmatic Perimeter organization. Originally organized by the Terran Mandate to detect and contain maltech outbreaks until Mandate fleet resources could be dispatched, the Perimeter retains numerous ancient override codes for pretech security protocols.",
    effect:
      "Once per turn, the faction may roll an additional d10 when making an attack against an asset that requires tech level 5 to purchase. The faction may roll an extra die when making a test to detect Stealthed assets.",
  },
  {
    name: "Pirates",
    desc:
      "This faction is a scourge of the spacelanes, driving up the cost of shipping and terrorizing merchant captains without pity. They steal and refit ships with vicious ingenuity, cobbling together space armadas out of the leavings of their prey.",
    effect:
      "Any movement of an asset onto a world that has a Base of Influence for this faction costs one extra FacCred, paid to this faction.",
  },
  {
    name: "Planetary Government",
    desc:
      "This faction is the legitimate government of a planet. Rebel groups and rival factions may have assets on the planet, but control over the instruments of the state is firmly in this faction's hands. The faction may rule openly, or it may simply have an inexorable grasp on the existing authorities.",
    effect:
      "The faction's permission is required to buy or import those assets marked as needing government permission. This tag can be acquired multiple times, once for each planet the faction controls.",
  },
  {
    name: "Plutocratic",
    desc:
      "This faction prizes wealth, and its membership strives constantly to expand and maintain personal fortunes. Perhaps it is a ruling council of oligarchs or a star-spanning trade cartel.",
    effect:
      "Once per turn, this faction can roll an additional d10 when making a Wealth attack.",
  },
  {
    name: "Preceptor Archive",
    desc:
      "This faction is or has close ties to a Preceptor Archive a place of learning operated by the learned Preceptors of the Great Archive. These Archives are peaceful institutions dedicated to the spread of practical knowledge and useful engineering to the wider cosmos. Their large numbers of educated personnel make advanced equipment more practical for deployment.",
    effect:
      "Purchasing an asset that requires tech level 4 or more costs one fewer FacCred than normal. The Preceptor Archive may also take the special action “Teach Planetary Population”, costing 2 FacCreds and allowing them to roll 1d12 for one world. On a 12, the world's tech level permanently becomes 4 for the purposes and purchases of this faction.",
  },
  {
    name: "Psychic Academy",
    desc:
      "Most significant factions are capable of employing psychics, but this faction can actually train their own. They excel at precise and focused application of the psionic disciplines, and can get far more out of their available psychic resources than other factions.",
    effect:
      "This faction can provide psionic mentor training to qualified psychics. Once per turn, this faction can also force a rival faction to reroll any one d10, whether or not they're involved in the roll.",
  },
  {
    name: "Savage",
    desc:
      "Whether a proud tribe of neoprimitives struggling against the material limits of their world or a pack of degenerate tomb world cannibals, this faction is accustomed to surviving without the benefits of advanced technology and maximizing local resources.",
    effect:
      "Once per turn, this faction can roll an extra die when defending with an asset that requires tech level 0 to purchase.",
  },
  {
    name: "Scavengers",
    desc:
      "This faction might live within the wreckage of a tomb world, salvage the castoffs of some decadent pleasure-world or ply the ruins of an orbital scrapyard. Whatever their territory, this faction knows how to find worth amid seemingly useless trash.",
    effect:
      "Whenever the faction destroys an asset or has one of their assets destroyed, they gain 1 FacCred.",
  },
  {
    name: "Secretive",
    desc:
      "This faction is marked by elaborate protocols of secrecy and misdirection. It may be split up into numerous semi-autonomous cells, or consist largely of trained espionage professionals. Finding the assets of such a faction can often be more difficult than destroying them.",
    effect:
      "All assets purchased by this faction automatically begin Stealthed. See the list of Cunning assets for details on Stealth.",
  },
  {
    name: "Technical Expertise",
    desc:
      "The faction is staffed by large numbers of expert engineers and scientists. They can turn even the most unpromising labor pool into superb technicians.",
    effect:
      "This faction treats all planets on which they have a Base of Influence as if they were at least tech level 4. They can build Starship-type assets on any world with at least ten thousand occupants.",
  },
  {
    name: "Theocratic",
    desc:
      "The faction is fueled by the fierce certainty that God is with them- and with no one else. The tight and occasionally irrational obedience that pervades the organization makes it difficult to infiltrate or subvert effectively.",
    effect:
      "Once per turn, this faction can roll an extra d10 when defending against a Cunning attack.",
  },
  {
    name: "Warlike",
    desc:
      "There are factions with a military orientation, and then there are factions that just really love killing things. Whether or not this faction has developed sophisticated military resources and techniques, the membership is zealous in battle and has a positive taste for fighting.",
    effect:
      "Once per turn, this faction can roll an additional d10 when making a Force attack.",
  },
];
