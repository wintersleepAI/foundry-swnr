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
