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
}
export const document = SWNRProgram;
export const name = "program";
