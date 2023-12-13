import { SWNRBaseActor } from "../base-actor";

export class SWNRNPCActor extends SWNRBaseActor<"npc"> {
  static numberRegex = /^\d+$/;
  static hitDiceD8Regex = /^\d+d$/;
  static hitDiceRegex = /^\d+[Dd]\d+$/;
  static hpRegex = /^\d+\s?[hH][pP]\s?$/;

  prepareBaseData(): void {
    const e = this.data.data.effort;
    e.value = e.max - e.current - e.scene - e.day;
    const useCWNArmor = game.settings.get("swnr", "useCWNArmor") ? true : false;
    const useCWNTrauma = game.settings.get("swnr", "useTrauma") ? true : false;
    if (this.data.data.settings == null) {
      this.data.data.settings = {
        useCWNArmor: useCWNArmor,
        useTrauma: useCWNTrauma,
      };
    } else {
      this.data.data.settings.useCWNArmor = useCWNArmor;
    }
    this.data.data.access.max = this.data.data.skillBonus;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    const useCWNArmor = game.settings.get("swnr", "useCWNArmor") ? true : false;
    const useTrauma = game.settings.get("swnr", "useTrauma") ? true : false;
    if (data.settings == null) {
      data.settings = {
        useCWNArmor: useCWNArmor,
        useTrauma: useTrauma,
      };
    } else {
      data.settings.useCWNArmor = useCWNArmor;
      data.settings.useTrauma = useTrauma;
    }
    if (data.baseSoakTotal.max > 0) {
      data.soakTotal.max += data.baseSoakTotal.max;
    }
    if (data.baseSoakTotal.value > 0) {
      data.soakTotal.value += data.baseSoakTotal.value;
    }
  }

  // Set the max/value health based on D8 hit dice
  async rollHitDice(forceDieRoll: boolean): Promise<void> {
    if (!forceDieRoll && this.data.data["health_max_modified"]) {
      //For debug: console.log("You have modified the NPCs max health. Not rolling");
      return;
    }
    let hitDice = this.data.data.hitDice;
    if (hitDice == null || hitDice == "0" || hitDice == "") {
      return;
    }
    if (hitDice.includes("+")) {
      const split = hitDice.split("+", 2);
      hitDice = split[0].trim();
      if (split.length > 1) {
        const soak = split[1].trim();
        if (SWNRNPCActor.numberRegex.test(soak)) {
          if (game.settings.get("swnr", "useCWNArmor") == false) {
            ui.notifications?.info(
              "NPC has soak, but CWN Armor is disabled. Ignoring soak"
            );
          } else {
            await this.update({
              "data.baseSoakTotal.max": parseInt(soak),
              "data.baseSoakTotal.value": parseInt(soak),
            });
          }
        } else {
          ui.notifications?.error(
            "NPC soak must be a number, not " + soak + " Not rolling Hit Dice"
          );
          return;
        }
      }
    }
    //For debug: console.log("rolling NPC hit dice", this);
    let dieRoll = "";
    if (SWNRNPCActor.numberRegex.test(hitDice)) {
      dieRoll = `${hitDice}d8`;
    } else if (SWNRNPCActor.hitDiceD8Regex.test(hitDice)) {
      dieRoll = `${hitDice}8`;
    } else if (SWNRNPCActor.hitDiceRegex.test(hitDice)) {
      dieRoll = `${hitDice}`;
    } else if (SWNRNPCActor.hpRegex.test(hitDice)) {
      hitDice = hitDice.toLowerCase().split("hp")[0].trim();
      dieRoll = `${hitDice}`;
    } else {
      ui.notifications?.error(
        "NPC hit dice must be a number, Nd, NdX, N HP (where N/X are numbers)  not " +
          hitDice +
          " Not rolling Hit Dice"
      );
      return;
    }
    //For debug: console.log(`Updating health using ${hitDice} hit die. Roll ${dieRoll} `);

    const roll = new Roll(`${dieRoll}`);
    await roll.roll({ async: true });
    if (roll != undefined && roll.total != undefined) {
      const newHealth = roll.total;
      await this.update({
        "data.health.max": newHealth,
        "data.health.value": newHealth,
      });
    }
  }

  async rollSave(save: string): Promise<void> {
    const roll = new Roll("1d20");
    await roll.roll({ async: true });
    const flavor = game.i18n.format(
      parseInt(roll.result) >= this.data.data.saves
        ? game.i18n.localize("swnr.npc.saving.success")
        : game.i18n.localize("swnr.npc.saving.failure"),
      { actor: this.name, target: this.data.data.saves }
    );
    roll.toMessage({ flavor, speaker: { actor: this.id } });
  }

  _onCreate(
    data: Parameters<SWNRBaseActor["_onCreate"]>[0],
    options: Parameters<SWNRBaseActor["_onCreate"]>[1],
    userId: string
  ): void {
    super._onCreate(data, options, userId);
    if (game.user?.isGM && game.userId === userId) {
      if (this.data["items"]["length"] || game.userId !== userId) return;
      const unarmed = this.data.items.filter(
        (i) => i.name == game.i18n.localize("swnr.npc.unarmed")
      );
      if (unarmed.length == 0) {
        this.createEmbeddedDocuments("Item", [
          {
            name: game.i18n.localize("swnr.npc.unarmed"),
            type: "weapon",
            data: {
              ammo: {
                type: "none",
              },
              damage: "d2",
            },
            img: "icons/equipment/hand/gauntlet-armored-leather-grey.webp",
          },
        ]);
      }
    }
  }

  _onUpdate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    data: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    options: any,
    userId: string
  ): void {
    if (this.data.data.cyberdecks && this.data.data.cyberdecks.length > 0) {
      for (const deckId of this.data.data.cyberdecks) {
        const deck = game.actors?.get(deckId);
        if (deck) {
          deck.sheet?.render();
        }
      }
    }
    super._onUpdate(data, options, userId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Hooks.on("createToken", (document, options, userId) => {
  if (game.settings.get("swnr", "useRollNPCHD")) {
    if (game.user?.isGM && game.userId === userId) {
      if (document.actor?.type == "npc") {
        document.actor.rollHitDice(false);
      }
    }
  }
});

export const document = SWNRNPCActor;
export const name = "npc";
