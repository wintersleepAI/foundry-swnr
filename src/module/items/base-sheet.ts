import { SWNRCharacterActor } from "../actors/character";
import { SWNRNPCActor } from "../actors/npc";
import { SWNRShipActor } from "../actors/ship";

interface BaseSheetData extends ItemSheet.Data {
  actor: SWNRCharacterActor | SWNRNPCActor | SWNRShipActor | null;
}
export class BaseSheet extends ItemSheet<DocumentSheet.Options, BaseSheetData> {
  static get defaultOptions(): DocumentSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [],
    });
  }

  _injectHTML(html: JQuery<HTMLElement>): void {
    html
      .find(".window-content")
      .addClass(["cq", "overflow-y-scroll", "relative"]);
    super._injectHTML(html);
  }

  // (name:string, options = {}:TextEditor.Options, initialContent = ""
  activateEditor(
    name: string,
    options = {} as TextEditor.Options,
    initialContent = ""
  ): void {
    const editor = this.editors[name];
    if (!editor) throw new Error(`${name} is not a registered editor name!`);
    options = foundry.utils.mergeObject(editor.options, options);
    options.height = Math.max(options.height, options.target.offsetHeight, 100);
    TextEditor.create(options, initialContent || editor.initial).then((mce) => {
      editor.mce = mce;
      editor.changed = false;
      editor.active = true;
      mce.focus();
      mce.on("change", () => (editor.changed = true));
    });
  }
  /**
   * @override
   */
  get template(): string {
    return `systems/swnr/templates/items/${this.item.data.type}-sheet.html`;
  }

  async getData(): Promise<BaseSheetData> {
    let data = super.getData();
    if (data instanceof Promise) data = await data;
    data.actor = this.actor;
    return data;
  }
}
export const sheet = BaseSheet;
export const types = [];
