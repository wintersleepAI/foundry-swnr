import { SWNRBaseItem } from "./../base-item";

export class SWNRArmor extends SWNRBaseItem<"armor"> {
  popUpDialog?: Dialog;

  prepareDerivedData(): void {
    const data = this.data.data;
    data.settings = {
      useCWNArmor: game.settings.get("swnr", "useCWNArmor") ? true : false,
    };
  }
}
export const document = SWNRArmor;
export const name = "armor";
