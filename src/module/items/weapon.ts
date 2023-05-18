import { SWNRBaseItem } from "./../base-item";
import { ValidatedDialog } from "../ValidatedDialog";

export class SWNRWeapon extends SWNRBaseItem<"weapon"> {
  popUpDialog?: Dialog;

  prepareDerivedData(): void {
    const data = this.data.data;
    data.settings = {
      useTrauma: game.settings.get("swnr", "useTrauma") ? true : false,
    };
  }

  get ammo(): this["data"]["data"]["ammo"] {
    return this.data.data.ammo;
  }

  get canBurstFire(): boolean {
    return (
      this.ammo.burst &&
      (this.ammo.type === "infinite" ||
        (this.ammo.type !== "none" && this.ammo.value >= 3))
    );
  }

  get hasAmmo(): boolean {
    return (
      this.ammo.type === "none" ||
      this.ammo.type === "infinite" ||
      this.ammo.value > 0
    );
  }

  async rollAttack(
    damageBonus: number,
    stat: number,
    skillMod: number,
    modifier: number,
    useBurst: boolean
  ): Promise<void> {
    if (!this.actor) {
      const message = `Called rollAttack on item without an actor.`;
      ui.notifications?.error(message);
      throw new Error(message);
    }
    if (!this.hasAmmo) {
      ui.notifications?.error(`Your ${this.name} is out of ammo!`);
      return;
    }

    if (
      useBurst &&
      this.ammo.type !== "infinite" &&
      this.ammo.type !== "none" &&
      this.ammo.value < 3
    ) {
      ui.notifications?.error(
        `Your ${this.name} is does not have enough ammo to burst!`
      );
      return;
    }
    //console.log({ skillMod, stat, modifier, useBurst, damageBonus });
    const template = "systems/swnr/templates/chat/attack-roll.html";
    const burstFire = useBurst ? 2 : 0;

    // 1d20 + attack bonus (PC plus weapon) + skill mod (-2 if untrained)
    // weapon dice + stat mod + skill if enabled or punch.
    // shock: damage + stat
    // const skill = this.actor.items.filter(w => w.)
    // Burst is +2 To hit and to damage

    const attackRollDie = game.settings.get("swnr", "attackRoll");
    const rollData = {
      actor: this.actor.getRollData(),
      weapon: this.data.data,
      hitRoll: <number | undefined>undefined,
      stat,
      burstFire,
      modifier,
      damageBonus,
      effectiveSkillRank: skillMod < 0 ? -2 : skillMod,
      shockDmg: this.data.data.shock?.dmg > 0 ? this.data.data.shock.dmg : 0,
      attackRollDie,
    };

    const hitRoll = new Roll(
      "@attackRollDie + @burstFire + @modifier + @actor.ab + @weapon.ab + @stat + @effectiveSkillRank",
      rollData
    );
    await hitRoll.roll({ async: true });
    const hitExplainTip = "1d20 +burst +mod +CharAB +WpnAB +Stat +Skill";
    rollData.hitRoll = +(hitRoll.dice[0].total?.toString() ?? 0);
    const damageRoll = new Roll(
      this.data.data.damage + " + @burstFire + @stat + @damageBonus",
      rollData
    );
    await damageRoll.roll({ async: true });
    const damageExplainTip = "roll +burst +statBonus +dmgBonus";

    const diceTooltip = {
      hit: await hitRoll.render(),
      damage: await damageRoll.render(),
      hitExplain: hitExplainTip,
      damageExplain: damageExplainTip,
    };

    let traumaRollRender: null | string = null;
    let traumaDamage: null | string = null;
    if (
      this.data.data.settings?.useTrauma &&
      this.data.data.trauma.die != null &&
      this.data.data.trauma.die !== "none" &&
      this.data.data.trauma.rating != null
    ) {
      const traumaRoll = new Roll(this.data.data.trauma.die);
      await traumaRoll.roll({ async: true });
      traumaRollRender = await traumaRoll.render();
      if (
        traumaRoll &&
        traumaRoll.total &&
        traumaRoll.total >= 6 &&
        damageRoll?.total
      ) {
        const traumaDamageRoll = new Roll(
          `${damageRoll.total} * ${this.data.data.trauma.rating}`
        );
        await traumaDamageRoll.roll({ async: true });
        traumaDamage = await traumaDamageRoll.render();
      }
    }

    const rollArray = [hitRoll, damageRoll];
    // Placeholder for shock damage
    let shock_content: string | null = null;
    let shock_roll: string | null = null;
    // Show shock damage
    if (game.settings.get("swnr", "addShockMessage")) {
      if (this.data.data.shock && this.data.data.shock.dmg > 0) {
        shock_content = `Shock Damage  AC ${this.data.data.shock.ac}`;
        const _shockRoll = new Roll(
          " @shockDmg + @stat " +
            (this.data.data.skillBoostsShock ? ` + ${damageBonus}` : ""),
          rollData
        );
        await _shockRoll.roll({ async: true });
        shock_roll = await _shockRoll.render();
        rollArray.push(_shockRoll);
      }
    }

    const dialogData = {
      actor: this.actor,
      weapon: this,
      hitRoll,
      stat,
      damageRoll,
      burstFire,
      modifier,
      effectiveSkillRank: rollData.effectiveSkillRank,
      diceTooltip,
      ammoRatio: Math.clamped(
        Math.floor((this.data.data.ammo.value * 20) / this.data.data.ammo.max),
        0,
        20
      ),
      shock_roll,
      shock_content,
      traumaDamage,
      traumaRollRender,
    };
    const rollMode = game.settings.get("core", "rollMode");
    // const dice = hitRoll.dice.concat(damageRoll.dice)
    // const formula = dice.map(d => (<any>d).formula).join(' + ');
    // const results = dice.reduce((a, b) => a.concat(b.results), [])
    const diceData = Roll.fromTerms([PoolTerm.fromRolls(rollArray)]);
    if (
      this.data.data.ammo.type !== "none" &&
      this.data.data.ammo.type !== "infinite"
    ) {
      const newAmmoTotal = this.data.data.ammo.value - 1 - burstFire;
      await this.update({ "data.ammo.value": newAmmoTotal }, {});
      if (newAmmoTotal === 0)
        ui.notifications?.warn(`Your ${this.name} is now out of ammo!`);
    }
    const chatContent = await renderTemplate(template, dialogData);
    // TODO: break up into two rolls and chain them?
    // const promise = game.dice3d
    //   ? game.dice3d.showForRoll(diceData)
    //   : Promise.resolve();
    // promise.then(() => {
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor ?? undefined }),
      roll: JSON.stringify(diceData),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
    getDocumentClass("ChatMessage").create(chatData);
    // });
  }

  async roll(shiftKey = false): Promise<void> {
    if (!this.actor) {
      const message = `Called weapon.roll on item without an actor.`;
      ui.notifications?.error(message);
      new Error(message);
      return;
    }
    if (!this.hasAmmo) {
      ui.notifications?.error(`Your ${this.name} is out of ammo!`);
      return;
    }

    const title = game.i18n.format("swnr.dialog.attackRoll", {
      actorName: this.actor?.name,
      weaponName: this.name,
    });
    const ammo = this.data.data.ammo;
    const burstFireHasAmmo =
      ammo.type !== "none" && ammo.burst && ammo.value >= 3;

    let dmgBonus = 0;

    // for finesse weapons take the stat with the higher mod
    let statName = this.data.data.stat;
    const secStatName = this.data.data.secondStat;
    // check if there is 2nd stat name and its mod is better
    if (
      secStatName != null &&
      secStatName != "none" &&
      this.actor.data.data["stats"]?.[statName].mod <
        this.actor.data.data["stats"]?.[secStatName].mod
    ) {
      statName = secStatName;
    }

    // Set to not ask and just roll
    if (!shiftKey && this.data.data.remember && this.data.data.remember.use) {
      const stat = this.actor.data.data["stats"]?.[statName] || {
        mod: 0,
      };

      const skill = this.actor.getEmbeddedDocument(
        "Item",
        this.data.data.skill
      ) as SWNRBaseItem<"skill">;
      const skillMod = skill.data.data.rank < 0 ? -2 : skill.data.data.rank;

      if (this.actor?.type == "character") {
        dmgBonus = this.data.data.skillBoostsDamage ? skill.data.data.rank : 0;
      }
      return this.rollAttack(
        dmgBonus,
        stat.mod,
        skillMod,
        this.data.data.remember.modifier,
        this.data.data.remember.burst
      );
    }

    const dialogData = {
      actor: this.actor.data,
      weapon: this.data.data,
      skills: this.actor.itemTypes.skill,
      statName: statName,
      skill: this.data.data.skill,
      burstFireHasAmmo,
    };
    const template = "systems/swnr/templates/dialogs/roll-attack.html";
    const html = await renderTemplate(template, dialogData);

    const _rollForm = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const modifier = parseInt(
        (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
      );
      const burstFire = (<HTMLInputElement>(
        form.querySelector('[name="burstFire"]')
      ))?.checked
        ? true
        : false;

      const skillId =
        (<HTMLSelectElement>form.querySelector('[name="skill"]'))?.value ||
        this.data.data.skill;

      if (!this.actor) {
        console.log("Error actor no longer exists ");
        return;
      }
      let skillMod = 0;

      const skill = this.actor.getEmbeddedDocument(
        "Item",
        skillId
      ) as SWNRBaseItem<"skill">;

      if (this.actor?.type == "npc" && html.find('[name="skilled"]')) {
        const npcSkillMod = html.find('[name="skilled"]').prop("checked")
          ? this.actor.data.data["skillBonus"]
          : 0;
        if (npcSkillMod) skillMod = npcSkillMod;
      } else {
        skillMod = skill.data.data.rank < 0 ? -2 : skill.data.data.rank;
      }
      // for finesse weapons take the stat with the higher mod
      let statName = this.data.data.stat;
      const secStatName = this.data.data.secondStat;
      // check if there is 2nd stat name and its mod is better
      if (
        secStatName != null &&
        secStatName != "none" &&
        this.actor.data.data["stats"]?.[statName].mod <
          this.actor.data.data["stats"]?.[secStatName].mod
      ) {
        statName = secStatName;
      }

      const stat = this.actor.data.data["stats"]?.[statName] || {
        mod: 0,
      };
      // 1d20 + attack bonus (PC plus weapon) + skill mod (-2 if untrained)
      // weapon dice + stat mod + skill if enabled or punch.
      // shock: damage + stat
      // const skill = this.actor.items.filter(w => w.)
      // Burst is +2 To hit and to damage
      if (this.actor?.type == "character") {
        dmgBonus = this.data.data.skillBoostsDamage ? skill.data.data.rank : 0;
      } else if (this.actor?.type == "npc") {
        dmgBonus = this.data.data.skillBoostsDamage
          ? this.actor.data.data.skillBonus
          : 0;
        if (this.actor.data.data.attacks.bonusDamage) {
          dmgBonus += this.actor.data.data.attacks.bonusDamage;
        }
      }
      // If remember is checked, set the skill and data
      const remember = (<HTMLInputElement>(
        form.querySelector('[name="remember"]')
      ))?.checked
        ? true
        : false;
      if (remember) {
        await this.update({
          data: {
            remember: {
              use: true,
              burst: burstFire,
              modifier: modifier,
            },
            skill: skillId,
          },
        });
      }

      return this.rollAttack(dmgBonus, stat.mod, skillMod, modifier, burstFire);
      // END roll form
    };

    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: title,
        content: html,
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.localize("swnr.chat.roll"),
            callback: _rollForm,
          },
        },
      },
      {
        failCallback: (): void => {
          ui.notifications?.error(game.i18n.localize("swnr.roll.skillNeeded"));
        },
        classes: ["swnr"],
      }
    );
    this.popUpDialog.render(true);
  }
}
export const document = SWNRWeapon;
export const name = "weapon";
