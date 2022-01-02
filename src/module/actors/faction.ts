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
fusion costs them that turn’s FacCred income and they
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
    const assetMaint = assets
      .map((i) => i.data.data.maintenance)
      .reduce((i, n) => i + n, 0);
    const income =
      wealthIncome + cunningIncome + forceIncome + assetIncome - assetMaint;
    if (income > 0) {

    }
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
