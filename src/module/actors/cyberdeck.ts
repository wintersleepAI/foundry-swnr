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
      ui.notifications?.info(
        `Removed hacker from ${this.name}. Manually remove the cyberdeck from the hacker's sheet`
      );
    } else {
      ui.notifications?.error("Crew member not found");
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async _preCreate(actorDataConstructorData, options, user): Promise<void> {
    await super._preCreate(actorDataConstructorData, options, user);
    if (
      actorDataConstructorData.type &&
      this.data._source.img == "icons/svg/mystery-man.svg"
    ) {
      const img = "systems/swnr/assets/icons/cyberdeck.png";
      this.data._source.img = img;
    }
  }
}

export const document = SWNRCyberdeckActor;
export const name = "cyberdeck";
