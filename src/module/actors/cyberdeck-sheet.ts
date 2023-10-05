import { SWNRCyberdeckActor } from "./cyberdeck";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";
import { BaseActorSheet } from "../actor-base-sheet";

interface CyberdeckActorSheetData extends ActorSheet.Data {
  //shipWeapons?: Item[];
  itemTypes: SWNRCyberdeckActor["itemTypes"];
}

export class CyberdeckActorSheet extends BaseActorSheet<CyberdeckActorSheetData> {
  object: SWNRCyberdeckActor;

  get actor(): SWNRCyberdeckActor {
    if (super.actor.type != "cyberdeck") throw Error;
    return super.actor;
  }

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "cyberdeck"],
      template: "systems/swnr/templates/actors/cyberdeck-sheet.html",
      width: 800,
      height: 600,
    });
  }

  async getData(
    options?: Application.RenderOptions
  ): Promise<CyberdeckActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;

    let hacker: SWNRCharacterActor | SWNRNPCActor | null = null;
    if (this.actor.data.data.hackerId) {
      const cId = this.actor.data.data.hackerId;
      const crewMember = game.actors?.get(cId);
      if (crewMember) {
        if (crewMember.type == "character" || crewMember.type == "npc") {
          hacker = crewMember;
        }
      }
    }
    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
      hacker: hacker,
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
  }
}

export const sheet = CyberdeckActorSheet;
export const types = ["cyberdeck"];
