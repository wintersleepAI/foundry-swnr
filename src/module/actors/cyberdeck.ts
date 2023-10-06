import { SWNRBaseActor } from "../base-actor";

export class SWNRCyberdeckActor extends SWNRBaseActor<"cyberdeck"> {
  getRollData(): this["data"]["data"] {
    this.data._source.data;
    const data = super.getRollData();
    // data.itemTypes = <SWNRCharacterData["itemTypes"]>this.itemTypes;
    return data;
  }

  prepareDerivedData(): void {
    const data = this.data.data;
    //TODO
  }

  async addHacker(actorId: string): Promise<void> {
    const actor = game.actors?.get(actorId);
    if (actor) {
      if (actor.type === "character" || actor.type === "npc") {
        const hackerId = this.data.data.hackerId;
        //Only add crew once
        if (hackerId) {
          //only one crew member allowed
          ui.notifications?.error("Cyberdeck already has a hacker");
          return;
        } else {
          // No crew member / hacker
          await this.update({
            "data.hackerId": actorId,
          });
          const cyberdecks = actor.data.data.cyberdecks;
          if (this.id && cyberdecks.indexOf(this.id) === -1) {
            cyberdecks.push(this.id);
            await actor.update({
              "data.cyberdecks": cyberdecks,
            });
          }
        }
        const itemName = this.name;
        actor.createEmbeddedDocuments(
          "Item",
          [
            {
              name: itemName,
              type: "item",
              img: "systems/swnr/assets/icons/cyberdeck.png",
              data: {
                encumbrance: this.data.data.encumberance,
              },
            },
          ],
          {}
        );
        ui.notifications?.info(
          `Created a cyberdeck item "${itemName}" on ${actor.name}'s sheet`
        );
      } else {
        ui.notifications?.error("Only characters and NPCs can be hackers");
        return;
      }
    } else {
      ui.notifications?.error("Actor added no longer exists");
    }
  }

  async removeCrew(actorId: string): Promise<void> {
    const hackerId = this.data.data.hackerId;
    //Only remove if there;
    if (hackerId !== actorId) {
      ui.notifications?.error(
        "Removing hacker from deck, but not currently the hacker"
      );
      return;
    }
    if (hackerId) {
      await this.update({
        "data.hackerId": "",
      });
      // Remove the deck from the list of decks ID's on the hacker actor
      const actor = game.actors?.get(actorId);
      if (
        actor &&
        this.id &&
        (actor.type === "character" || actor.type === "npc")
      ) {
        const cyberdeck = actor.data.data.cyberdecks;
        const idx = cyberdeck.indexOf(this.id);
        if (idx != -1) {
          cyberdeck.splice(idx, 1);
          await actor.update({
            "data.cyberdecks": cyberdeck,
          });
        }
      }
      ui.notifications?.info(
        `Removed hacker from ${this.name}. Manually remove the cyberdeck from the hacker's sheet`
      );
    } else {
      ui.notifications?.error("Crew member not found");
    }
  }

  async _onCreate(): Promise<void> {
    await this.update({
      "token.actorLink": true,
      img: "systems/swnr/assets/icons/cyberdeck.png",
    });
  }
}

export const document = SWNRCyberdeckActor;
export const name = "cyberdeck";
