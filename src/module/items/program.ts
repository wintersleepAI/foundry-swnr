import { SWNRCharacterActor } from "../actors/character";
import { SWNRNPCActor } from "../actors/npc";
import { SWNRBaseItem } from "./../base-item";

export class SWNRProgram extends SWNRBaseItem<"program"> {
  popUpDialog?: Dialog;

  // prepareDerivedData(): void {
  //   const data = this.data.data;
  // }

  async _onCreate(): Promise<void> {
    // await this.update({
    //   img: ,
    // });
  }

  async roll(_shiftKey = false): Promise<void> {
    let level = 1;
    const skillRollData = {
      skillMod: 0,
      attrMod: 0,
      crownPenalty: 0,
      wirelessPenalty: 0,
      skillRoll: "2d6",
    };
    const cyberdeck = this.actor;
    if (!cyberdeck || cyberdeck.type !== "cyberdeck") {
      ui.notifications?.info("Rolling program without a cyberdeck");
      return;
    }
    if (cyberdeck.data.data.crownPenalty) {
      skillRollData.crownPenalty = -1;
    }

    if (cyberdeck.data.data.wirelessConnectionPenalty) {
      skillRollData.wirelessPenalty = -2;
    }
    const hacker = cyberdeck.getHacker();
    if (hacker == null) {
      // no actor, set default values?
    } else {
      if (hacker.type == "character") {
        level = hacker.data.data.level.value;
        const skill = (<SWNRCharacterActor>hacker).getSkill("Program");
        if (skill) {
          if (skill.data.data.pool != "ask") {
            skillRollData.skillRoll = skill.data.data.pool;
          }
          skillRollData.skillMod = skill.data.data.rank;
        }
        skillRollData.attrMod = hacker.data.data.stats.int.mod;
      } else if (hacker.type == "npc") {
        level = hacker.data.data.hitDice;
        skillRollData.skillMod = hacker.data.data.skillBonus;
      } else {
        console.log(this);
        console.log(this.actor);
        ui.notifications?.error(
          "Rolling program non-character or non-npc actor"
        );
        return;
      }
    }
    let programRoll = "";
    // A bit hacky, but it works
    if (
      this.name &&
      (this.name.indexOf("Stun") >= 0 || this.name?.indexOf("Kill") >= 0)
    ) {
      const rollStr = `${level}d10`;
      const roll = new Roll(rollStr);
      await roll.roll({ async: true });
      programRoll = await roll.render();
    }
    const skillRoll = new Roll(
      "@skillRoll + @skillMod + @attrMod + @crownPenalty + @wirelessPenalty",
      skillRollData
    );
    await skillRoll.roll({ async: true });
    const template = "systems/swnr/templates/chat/program-roll.html";
    const dialogData = {
      actor: hacker,
      program: this,
      programRoll: programRoll,
      skillRoll: await skillRoll.render(),
      programSkill: "Int/Program",
    };
    const rollMode = game.settings.get("core", "rollMode");

    const chatContent = await renderTemplate(template, dialogData);
    // TODO: break up into two rolls and chain them?
    // const promise = game.dice3d
    //   ? game.dice3d.showForRoll(diceData)
    //   : Promise.resolve();
    // promise.then(() => {
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor ?? undefined }),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
    getDocumentClass("ChatMessage").create(chatData);
  }
}
export const document = SWNRProgram;
export const name = "program";