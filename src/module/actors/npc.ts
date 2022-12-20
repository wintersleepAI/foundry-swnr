import { SWNRBaseActor } from "../base-actor";

export class SWNRNPCActor extends SWNRBaseActor<"npc"> {
  prepareBaseData(): void {
    const e = this.data.data.effort;
    e.value = e.max - e.current - e.scene - e.day;
  }

  // Set the max/value health based on D8 hit dice
  async rollHitDice(forceDieRoll: boolean): Promise<void> {
    if (!forceDieRoll && this.data.data["health_max_modified"]) {
      //For debug: console.log("You have modified the NPCs max health. Not rolling");
      return;
    }
    //For debug: console.log("rolling NPC hit dice", this);
    if (this.data.data.hitDice != null && this.data.data.hitDice > 0) {
      //For debug: console.log(`Updating health using ${this.data.data.hitDice} hit die `);
      const roll = new Roll(`${this.data.data.hitDice}d8`);
      await roll.roll({ async: true });
      if (roll != undefined && roll.total != undefined) {
        const newHealth = roll.total;
        await this.update({
          "data.health.max": newHealth,
          "data.health.value": newHealth,
        });
      }
    } else {
      //For debug: console.log("NPC has no hit dice, not rolling health");
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
