import { SWNRCyberdeckActor } from "./cyberdeck";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";
import { SWNRProgram } from "../items/program";

interface CyberdeckActorSheetData extends ActorSheet.Data {
  //shipWeapons?: Item[];
  itemTypes: SWNRCyberdeckActor["itemTypes"];
  activePrograms: SWNRProgram[];
  verbs: SWNRProgram[];
  subjects: SWNRProgram[];
  datafiles: SWNRProgram[];
}

export class CyberdeckActorSheet extends VehicleBaseActorSheet<CyberdeckActorSheetData> {
  object: SWNRCyberdeckActor;

  get actor(): SWNRCyberdeckActor {
    if (super.actor.type != "cyberdeck") throw Error;
    return super.actor;
  }

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "cyberdeck"],
      template: "systems/swnr/templates/actors/cyberdeck-sheet.html",
      width: 850,
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
    const programs: SWNRProgram[] = this.actor.items.filter(
      (item): item is SWNRProgram => item.type === "program"
    ) as SWNRProgram[];

    const activePrograms: SWNRProgram[] = programs.filter(
      (item): item is SWNRProgram => item.data.data.type === "running"
    ) as SWNRProgram[];

    const verbs: SWNRProgram[] = programs.filter(
      (item): item is SWNRProgram => item.data.data.type === "verb"
    ) as SWNRProgram[];

    const subjects: SWNRProgram[] = programs.filter(
      (item): item is SWNRProgram => item.data.data.type === "subject"
    ) as SWNRProgram[];

    const datafiles: SWNRProgram[] = programs.filter(
      (item): item is SWNRProgram => item.data.data.type === "datafile"
    ) as SWNRProgram[];

    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
      activePrograms: activePrograms,
      verbs: verbs,
      subjects: subjects,
      datafiles: datafiles,
      hacker: hacker,
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
  }
}

export const sheet = CyberdeckActorSheet;
export const types = ["cyberdeck"];
