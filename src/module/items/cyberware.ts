import { SWNRBaseItem } from "./../base-item";

export class SWNRCyberware extends SWNRBaseItem<"cyberware"> {
  popUpDialog?: Dialog;

  prepareDerivedData(): void {
    const data = this.data.data;
    data.settings = {
      useCWNCyber: game.settings.get("swnr", "useCWNCyber") ? true : false,
    };
  }
}

export const document = SWNRCyberware;
export const name = "cyberware";
