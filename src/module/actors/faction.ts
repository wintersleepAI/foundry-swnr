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

  async logMessage(content: string, _roll: Roll | null): Promise<void> {
    const gm_ids: string[] = ChatMessage.getWhisperRecipients("GM")
      .filter((i) => i)
      .map((i) => i.id)
      .filter((i): i is string => i !== null);
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
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
    const goal = this.data.data.factionGoal;
    if (!goal) {
      await this.setGoal();
    } else {
      const abondonGoal: boolean = await new Promise((resolve) => {
        Dialog.confirm({
          title: game.i18n.format("swnr.sheet.faction.abandonGoal", {
            name: goal,
          }),
          yes: () => resolve(true),
          no: () => resolve(false),
          content: game.i18n.format("swnr.sheet.faction.abandonGoal", {
            name: goal,
          }),
        });
      });
      if (abondonGoal) {
        await this.setGoal();
        return;
      }
    }
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
    await this.logMessage(msg, null);


    ChatMessage.create({
      content: msg,
      whisper: gm_ids,
      type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
    });
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
