import { SWNRBaseItem } from "../base-item";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRCharacterActor } from "../actors/character";
import { SWNRNPCActor } from "../actors/npc";

export class SWNRShipWeapon extends SWNRBaseItem<"shipWeapon"> {
  popUpDialog?: Dialog;

  get ammo(): this["data"]["data"]["ammo"] {
    return this.data.data.ammo;
  }

  get hasAmmo(): boolean {
    return this.ammo.type === "none" || this.ammo.value > 0;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    data.settings = {
      useTrauma: game.settings.get("swnr", "useTrauma") ? true : false,
    };
  }

  async rollAttack(
    shooterId: string | null,
    shooterName: string | null,
    skillMod: number,
    statMod: number,
    abMod: number,
    mod: number,
    weaponAb: number,
    npcSkill: number,
    useBurst: boolean
  ): Promise<void> {
    const template = "systems/swnr/templates/chat/attack-roll.html";
    const burstFire = useBurst ? 2 : 0;

    const attackRollDie = game.settings.get("swnr", "attackRoll");
    const rollData = {
      skillMod,
      statMod,
      abMod,
      mod,
      weaponAb,
      npcSkill,
      attackRollDie,
      burstFire,
    };

    const hitRollStr =
      "@attackRollDie + @skillMod + @statMod + @abMod + @mod + @weaponAb + @npcSkill + @burstFire";
    const damageRollStr = `${this.data.data.damage} + @statMod + @burstFire`;
    const hitRoll = new Roll(hitRollStr, rollData);
    await hitRoll.roll({ async: true });
    const damageRoll = new Roll(damageRollStr, rollData);
    await damageRoll.roll({ async: true });

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

    const diceTooltip = {
      hit: await hitRoll.render(),
      damage: await damageRoll.render(),
      hitExplain: hitRollStr,
      damageExplain: damageRollStr,
    };

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

    if (this.data.data.ammo.type !== "none") {
      const ammoUsed = useBurst ? 3 : 1;
      const newAmmoTotal = this.data.data.ammo.value - ammoUsed;
      await this.update({ "data.ammo.value": newAmmoTotal }, {});
      if (newAmmoTotal === 0)
        ui.notifications?.warn(`Your ${this.name} is now out of ammo!`);
    }

    const dialogData = {
      weapon: this,
      hitRoll,
      damageRoll,
      diceTooltip,
      traumaDamage,
      traumaRollRender,
    };

    const rollMode = game.settings.get("core", "rollMode");
    // const dice = hitRoll.dice.concat(damageRoll.dice)
    // const formula = dice.map(d => (<any>d).formula).join(' + ');
    // const results = dice.reduce((a, b) => a.concat(b.results), [])
    const diceData = Roll.fromTerms([
      PoolTerm.fromRolls([hitRoll, damageRoll]),
    ]);

    const chatContent = await renderTemplate(template, dialogData);
    const chatData = {
      speaker: { alias: shooterName },
      roll: JSON.stringify(diceData),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
    getDocumentClass("ChatMessage").create(chatData);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async roll(_shiftKey = false): Promise<void> {
    if (!this.actor) {
      const message = `Called ship weapon.roll on item without an actor.`;
      ui.notifications?.error(message);
      new Error(message);
      return;
    }
    if (this.data.data.broken || this.data.data.destroyed) {
      ui.notifications?.error(
        "Weapon is broken/disabled or destroyed. Cannot fire!"
      );
      return;
    }
    if (!this.hasAmmo) {
      ui.notifications?.error(`Your ${this.name} is out of ammo!`);
      return;
    }

    if (
      this.actor.type == "ship" ||
      this.actor.type == "mech" ||
      this.actor.type == "drone" ||
      this.actor.type == "vehicle"
    ) {
      let defaultGunnerId: string | null = null;
      // if there is one crew member or there is a gunner
      if (this.actor.data.data.crewMembers.length == 1) {
        defaultGunnerId = this.actor.data.data.crewMembers[0];
      } else if (this.actor.type == "ship") {
        defaultGunnerId = this.actor.data.data.roles.gunnery;
      }
      //get the gunner if exists
      let defaultGunner: SWNRCharacterActor | SWNRNPCActor | null = null;
      if (defaultGunnerId) {
        const _temp = game.actors?.get(defaultGunnerId);
        if (_temp && (_temp.type == "character" || _temp.type == "npc")) {
          defaultGunner = _temp;
        }
      }
      const crewArray: Array<SWNRCharacterActor | SWNRNPCActor> = [];
      if (this.actor.data.data.crewMembers) {
        for (let i = 0; i < this.actor.data.data.crewMembers.length; i++) {
          const cId = this.actor.data.data.crewMembers[i];
          const crewMember = game.actors?.get(cId);
          if (
            crewMember &&
            (crewMember.type == "character" || crewMember.type == "npc")
          ) {
            crewArray.push(crewMember);
          }
        }
      }

      const title = game.i18n.format("swnr.dialog.attackRoll", {
        actorName: this.actor?.name,
        weaponName: this.name,
      });

      if (defaultGunner == null && crewArray.length > 0) {
        //There is no gunner. Use first crew as default
        defaultGunner = crewArray[0];
        defaultGunnerId = crewArray[0].id;
      }
      if (defaultGunner?.type == "npc" && crewArray.length > 0) {
        //See if we have a non NPC to set as gunner to get skills and attr
        for (const char of crewArray) {
          if (char.type == "character") {
            defaultGunner = char;
            defaultGunnerId = char.id;
            break;
          }
        }
      }

      const dialogData = {
        actor: this.actor.data,
        weapon: this.data.data,
        defaultSkill1: "Shoot",
        defaultSkill2: "Combat/Gunnery",
        defaultStat: "int",
        gunner: defaultGunner,
        gunnerId: defaultGunnerId,
        crewArray: crewArray,
      };

      const template = "systems/swnr/templates/dialogs/roll-ship-attack.html";
      const html = await renderTemplate(template, dialogData);

      const _rollForm = async (html: HTMLFormElement) => {
        const form = <HTMLFormElement>html[0].querySelector("form");
        const mod = parseInt(
          (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
        );

        const shooterId = (<HTMLInputElement>(
          form.querySelector('[name="shooterId"]')
        ))?.value;
        const shooter = shooterId ? game.actors?.get(shooterId) : null;
        // const dice = (<HTMLSelectElement>form.querySelector('[name="dicepool"]'))
        //   .value;
        const skillName = (<HTMLSelectElement>(
          form.querySelector('[name="skill"]')
        ))?.value;
        const statName = (<HTMLSelectElement>(
          form.querySelector('[name="stat"]')
        ))?.value;

        const burstFire = (<HTMLInputElement>(
          form.querySelector('[name="burstFire"]')
        ))?.checked
          ? true
          : false;

        let skillMod = 0;
        let statMod = 0;
        let abMod = 0;
        const weaponAbStr =
          (<HTMLInputElement>form.querySelector('[name="weaponAb"]'))?.value ||
          "0";
        const npcSkillStr =
          (<HTMLInputElement>form.querySelector('[name="npcSkill"]'))?.value ||
          "0";
        const weaponAb = parseInt(weaponAbStr);
        const npcSkill = parseInt(npcSkillStr);
        let shooterName: string | null = "";
        if (shooter) {
          if (skillName) {
            // We need to look up by name
            for (const skill of shooter.itemTypes.skill) {
              if (skillName == skill.data.name) {
                skillMod =
                  skill.data.data["rank"] < 0 ? -2 : skill.data.data["rank"];
              }
            }
          } //end skill
          if (statName) {
            const sm = shooter.data.data["stats"]?.[statName].mod;
            if (sm) {
              console.log("setting stat mod", sm);
              statMod = sm;
            }
          }
          if (shooter.type == "character" || shooter.type == "npc") {
            abMod = shooter.data.data.ab;
          }
          shooterName = shooter.name;
        }
        this.rollAttack(
          shooterId,
          shooterName,
          skillMod,
          statMod,
          abMod,
          mod,
          weaponAb,
          npcSkill,
          burstFire
        );
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
          classes: ["swnr"],
        }
      );
      this.popUpDialog.render(true);
    } else {
      ui.notifications?.error("todo");
    }
  }
}

export const document = SWNRShipWeapon;
export const name = "shipWeapon";
