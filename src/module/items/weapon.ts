import { SWNRBaseItem } from "./../base-item";
import { ValidatedDialog } from "../ValidatedDialog";


export class SWNRWeapon extends SWNRBaseItem<"weapon"> {
  popUpDialog?: Dialog;

  get ammo(): this["data"]["data"]["ammo"] {
    return this.data.data.ammo;
  }

  get canBurstFire(): boolean {
    return this.ammo.type !== "none" && this.ammo.burst && this.ammo.value >= 3;
  }

  get hasAmmo(): boolean {
    return this.ammo.type === "none" || this.ammo.value > 0;
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

    console.log({ skillMod, modifier, useBurst, damageBonus });
    const template = "systems/swnr/templates/chat/attack-roll.html";
    const burstFire = useBurst ? 2 : 0;

    // 1d20 + attack bonus (PC plus weapon) + skill mod (-2 if untrained)
    // weapon dice + stat mod + skill if enabled or punch.
    // shock: damage + stat
    // const skill = this.actor.items.filter(w => w.)
    // Burst is +2 To hit and to damage

    const rollData = {
      actor: this.actor.getRollData(),
      weapon: this.data.data,
      hitRoll: <number | undefined>undefined,
      stat,
      burstFire,
      modifier,
      damageBonus,
      effectiveSkillRank: skillMod < 0 ? -2 : skillMod,
    };
    console.log(rollData);

    const hitRoll = new Roll(
      "1d20 + @burstFire + @modifier + @actor.ab + @weapon.ab + @stat + @effectiveSkillRank",
      rollData
    ).roll();
    const hitExplainTip = "1d20 +burst +mod +CharAB +WpnAB +Stat +Skill";
    rollData.hitRoll = +(hitRoll.dice[0].total?.toString() ?? 0);
    const damageRoll = new Roll(
      this.data.data.damage + " + @burstFire + @stat + @damageBonus",
      rollData
    ).roll();
    const damageExplainTip = "roll +burst +statBonus +dmgBonus"
    const diceTooltip = {
      hit: await hitRoll.render(),
      damage: await damageRoll.render(),
      hitExplain: hitExplainTip,
      damageExplain: damageExplainTip,
    };
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
    };
    const rollMode = game.settings.get("core", "rollMode");
    // const dice = hitRoll.dice.concat(damageRoll.dice)
    // const formula = dice.map(d => (<any>d).formula).join(' + ');
    // const results = dice.reduce((a, b) => a.concat(b.results), [])
    const diceData = Roll.fromTerms([
      PoolTerm.fromRolls([hitRoll, damageRoll]),
    ]);
    if (this.data.data.ammo.type !== "none") {
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

  async rollForm(html: HTMLFormElement) {
    console.log("Received ", html , this);
    const form = <HTMLFormElement>html[0].querySelector("form");
    const modifier = parseInt(
      (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
    );
    const burstFire = (<HTMLInputElement>(
      form.querySelector('[name="burstFire"]')
    ))?.checked
      ? 2
      : 0;
    const skillId =
      (<HTMLSelectElement>form.querySelector('[name="skill"]'))?.value ||
      this.data.data.skill;

    const actorId = (<HTMLSelectElement>form.querySelector('[name="actorId"]'))?.value;
    const statName = (<HTMLSelectElement>form.querySelector('[name="statName"]'))?.value;
    
    const actor = game.actors?.get(actorId);
    if (!actor) {
      console.log("Error actor no longer exists ", actorId);
      return;
    }

    const skill = actor.getEmbeddedDocument(
      "Item",
      skillId
    ) as SWNRBaseItem<"skill">;

    const stat = actor.data.data["stats"][statName] || {
      mod: 0,
    };
    console.log("look up", actor, skillId, skill,stat);
    // 1d20 + attack bonus (PC plus weapon) + skill mod (-2 if untrained)
    // weapon dice + stat mod + skill if enabled or punch.
    // shock: damage + stat
    // const skill = this.actor.items.filter(w => w.)
    // Burst is +2 To hit and to damage

    const rollData = {
      actor: this.actor?.getRollData(),
      weapon: this.data,
      stat,
      skill: skill,
      hitRoll: <number | undefined>undefined,
      burstFire,
      modifier,
      effectiveSkillRank:
        skill.data.data.rank < 0 ? -2 : skill.data.data.rank,
    };
    console.log(rollData, this);
    return this.rollWeaponHit(rollData);
  }

  async rollWeaponHit(rollData) {
    const template = "systems/swnr/templates/chat/attack-roll.html";
    if (!this.actor) {
      console.log("missing actor");
      return;
    }
    const hitRoll = new Roll(
      "1d20 + @burstFire + @modifier + @actor.ab + @weapon.ab + @stat.mod + @effectiveSkillRank",
      rollData
    ).roll();
    rollData.hitRoll = +(hitRoll.dice[0].total?.toString() ?? 0);
    const damageRoll = new Roll(
      this.data.data.damage +
        " + @burstFire + @stat.mod" +
        (this.data.data.skillBoostsDamage
          ? ` + ${rollData.skill.data.data.rank}`
          : ""),
      rollData
    ).roll();
    const diceTooltip = {
      hit: await hitRoll.render(),
      damage: await damageRoll.render(),
    };
    const dialogData = {
      actor: this.actor,
      weapon: this,
      skill: rollData.skill,
      hitRoll,
      stat: rollData.stat,
      damageRoll,
      burstFire: rollData.burstFire,
      modifier: rollData.modifier,
      effectiveSkillRank: rollData.effectiveSkillRank,
      diceTooltip,
      ammoRatio: Math.clamped(
        Math.floor(
          (this.data.data.ammo.value * 20) / this.data.data.ammo.max
        ),
        0,
        20
      ),
    };
    const rollMode = game.settings.get("core", "rollMode");
    const diceData = Roll.fromTerms([
      PoolTerm.fromRolls([hitRoll, damageRoll]),
    ]);
    if (this.data.data.ammo.type !== "none") {
      const newAmmoTotal = this.data.data.ammo.value - 1 - rollData.burstFire;
      await this.update({ "data.ammo.value": newAmmoTotal }, {});
      if (newAmmoTotal === 0)
        ui.notifications?.warn(`Your ${this.name} is now out of ammo!`);
    }
    const chatContent = await renderTemplate(template, dialogData);
    const chatMessage = getDocumentClass("ChatMessage");
    chatMessage.create(
      chatMessage.applyRollMode(
        {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          roll: JSON.stringify(diceData),
          content: chatContent,
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        },
        rollMode
      )
    );
  }

  async roll(): Promise<void> {
    console.log("Overloading roll");
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
    console.log("rolling", this, this.data.data);
    const title = game.i18n.format("swnr.dialog.attackRoll", {
      actorName: this.actor?.name,
      weaponName: this.name,
    });
    const ammo = this.data.data.ammo;
    const burstFireHasAmmo =
      ammo.type !== "none" && ammo.burst && ammo.value >= 3;

    const dialogData = {
      actor: this.actor.data,
      weapon: this.data.data,
      skills: this.actor.itemTypes.skill,
      stat: this.actor.data.data["stats"][this.data.data.stat],
      statName: this.data.data.stat,
      skill: this.data.data.skill,
      burstFireHasAmmo,
    };
    console.log(dialogData);
    const template = "systems/swnr/templates/dialogs/roll-attack.html";
    const html = await renderTemplate(template, dialogData);
    
    
    const _rollForm  = async (html: HTMLFormElement) => {
      console.log("Received ", html , this);
      const form = <HTMLFormElement>html[0].querySelector("form");
      const modifier = parseInt(
        (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
      );
      const burstFire = (<HTMLInputElement>(
        form.querySelector('[name="burstFire"]')
      ))?.checked
        ? 2
        : 0;
      const skillId =
        (<HTMLSelectElement>form.querySelector('[name="skill"]'))?.value ||
        this.data.data.skill;
  
      const actorId = (<HTMLSelectElement>form.querySelector('[name="actorId"]'))?.value;
      const statName = (<HTMLSelectElement>form.querySelector('[name="statName"]'))?.value;
      
      const actor = game.actors?.get(actorId);
      if (!actor) {
        console.log("Error actor no longer exists ", actorId);
        return;
      }
  
      const skill = actor.getEmbeddedDocument(
        "Item",
        skillId
      ) as SWNRBaseItem<"skill">;
  
      const stat = actor.data.data["stats"][statName] || {
        mod: 0,
      };
      console.log("look up", actor, skillId, skill,stat);
      // 1d20 + attack bonus (PC plus weapon) + skill mod (-2 if untrained)
      // weapon dice + stat mod + skill if enabled or punch.
      // shock: damage + stat
      // const skill = this.actor.items.filter(w => w.)
      // Burst is +2 To hit and to damage
  
      const rollData = {
        actor: this.actor?.getRollData(),
        weapon: this.data,
        stat,
        skill: skill,
        hitRoll: <number | undefined>undefined,
        burstFire,
        modifier,
        effectiveSkillRank:
          skill.data.data.rank < 0 ? -2 : skill.data.data.rank,
      };
      console.log(rollData, this);
      return this.rollWeaponHit(rollData);
    }
  
    
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
    console.log("t1", this);
    const s = this.popUpDialog.render(true);

  }

}
export const document = SWNRWeapon;
export const name = "weapon";
