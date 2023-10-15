import { SWNRCyberdeckActor } from "./cyberdeck";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";
import { SWNRProgram } from "../items/program";

interface CyberdeckActorSheetData extends ActorSheet.Data {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hacker: any;
  //shipWeapons?: Item[];
  itemTypes: SWNRCyberdeckActor["itemTypes"];
  activePrograms: SWNRProgram[];
  verbs: SWNRProgram[];
  subjects: SWNRProgram[];
  datafiles: SWNRProgram[];
  //hacker: SWNRCharacterActor | SWNRNPCActor | null;
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

    const access = {
      value: 0,
      max: 0,
    };

    if (hacker) {
      if (hacker.type == "character") {
        access.value =
          hacker.data.data.access.value + this.actor.data.data.bonusAccess;
        access.max =
          hacker.data.data.access.max + this.actor.data.data.bonusAccess;
      } else if (hacker.type == "npc") {
        access.value =
          hacker.data.data.access.value + this.actor.data.data.bonusAccess;
        access.max =
          hacker.data.data.access.max + this.actor.data.data.bonusAccess;
      }
    }

    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
      activePrograms: activePrograms,
      verbs: verbs,
      subjects: subjects,
      datafiles: datafiles,
      hacker: hacker,
      access: access,
    });
  }

  async _onActivate(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    if (this.actor.data.data.cpu.value < 1) {
      ui.notifications?.error("Not enough CPU to activate program");
      return;
    }
    const sheetData = await this.getData();
    let verbOptions = "";
    let subjectOptions = "";
    for (const verb of sheetData.verbs) {
      verbOptions += `<option value="${verb.id}">${verb.name}</option>`;
    }
    for (const subject of sheetData.subjects) {
      subjectOptions += `<option value="${subject.id}">${subject.name}</option>`;
    }
    if (!sheetData.verbs.length || !sheetData.subjects.length) {
      ui.notifications?.error("No verbs or subjects found");
      return;
    }
    const formContent = `<form>
    <div class="form-group">
      <label>Verb:</label>
      <select name="verbId"
        class="px-1.5 border border-gray-800 bg-gray-400 bg-opacity-75 placeholder-blue-800 placeholder-opacity-75 rounded-md">
        ${verbOptions}
      </select>
      <label>Subject:</label>
      <select name="subjectId"
        class="px-1.5 border border-gray-800 bg-gray-400 bg-opacity-75 placeholder-blue-800 placeholder-opacity-75 rounded-md">
        ${subjectOptions}
      </select>
    </div>
    </form>`;

    const _activateForm = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const verbID = (<HTMLInputElement>form.querySelector('[name="verbId"]'))
        ?.value;
      const subID = (<HTMLInputElement>form.querySelector('[name="subjectId"]'))
        ?.value;
      if (!verbID || !subID) {
        ui.notifications?.error("Verb or Subject not selected");
        return;
      }
      const verb = sheetData.verbs.find((item) => item.id === verbID);
      const subject = sheetData.subjects.find((item) => item.id === subID);
      if (!verb || !subject) {
        ui.notifications?.error("Verb or Subject not found");
        return;
      }

      const newProgram = {
        name: `${verb.name} ${subject.name}`,
        type: `program`,
        img: verb.img,
        data: {
          type: "running",
          cost: verb.data.data.cost,
          accessCost: verb.data.data.accessCost,
          useAffects: verb.data.data.useAffects,
        },
      };

      const docs = await this.actor.createEmbeddedDocuments(
        "Item",
        [newProgram],
        {}
      );
      const program = docs[0];
      if (!program || !(program instanceof SWNRProgram)) {
        ui.notifications?.error("Failed to create program");
        return;
      }

      // Consume access
      if (sheetData.hacker) {
        let access = 0;
        if (sheetData.hacker.type == "character") {
          access = sheetData.hacker.data.data.access.value;
          access -= program.data.data.accessCost;
        } else if (sheetData.hacker.type == "npc") {
          access = sheetData.hacker.data.data.access.value;
          access -= program.data.data.accessCost;
        }
        await sheetData.hacker.update({
          "data.access.value": access,
        });
        if (access <= 0) {
          ui.notifications?.info("Hacker has no access left");
        }
      }

      // Roll skill / create button
      program.roll();

      if (program.data.data.selfTerminating) {
        program.delete();
      } else {
        // await this.actor.update({
        //   "data.cpu.value": this.actor.data.data.cpu.value - 1,
        // });
      }
    };

    new Dialog({
      title: game.i18n.localize("swnr.sheet.cyberdeck.run"),
      content: formContent,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: `Run`,
          callback: _activateForm,
        },
      },
      default: "Run",
    }).render(true);
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html.find(".activate-program").on("click", this._onActivate.bind(this));
  }
}

export const sheet = CyberdeckActorSheet;
export const types = ["cyberdeck"];
