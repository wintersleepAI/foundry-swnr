import { SWNRBaseActor } from "../base-actor";
import { SWNRBaseItem } from "./../base-item";

export class SWNRFactionAsset extends SWNRBaseItem<"asset"> {
  popUpDialog?: Dialog;

  async roll(): Promise<void> {
    const data = this.data.data;
    if (data.attackDamage && data.attackDamage !== "") {
      const rollData = {
        hitBonus: "1",
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const otherActiveFactions: any[] | undefined = game.actors?.filter(
        (i) =>
          i.type === "faction" &&
          i.data.data.active == true &&
          this.actor?.id != i.id
      );
      console.log(otherActiveFactions);

      
      const hitRollStr = "1d10 + @hitBonuse";
      const hitRoll = new Roll(hitRollStr, rollData).roll();
      const damageRoll = new Roll(data.attackDamage, rollData).roll();
      const rollMode = game.settings.get("core", "rollMode");
      // const dice = hitRoll.dice.concat(damageRoll.dice)
      // const formula = dice.map(d => (<any>d).formula).join(' + ');
      // const results = dice.reduce((a, b) => a.concat(b.results), [])
      const diceData = Roll.fromTerms([
        PoolTerm.fromRolls([hitRoll, damageRoll]),
      ]);
    } else {
      // Basic template rendering data
      let content = `<h3> ${this.name} </h3>`;
      if ("description" in data) {
        content += `<span class="flavor-text"> ${data.description}</span>`;
      } else {
        content += "<span class='flavor-text'> No Description</span>";
      }

      ChatMessage.create({
        //speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: content, //${item.data.description}
        //type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      });
    }
  }
}

export const document = SWNRFactionAsset;
export const name = "asset";
