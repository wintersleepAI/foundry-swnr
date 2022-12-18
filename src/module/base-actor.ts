export class SWNRBaseActor<
  Type extends Actor["type"] = Actor["type"]
> extends Actor {
  //@ts-expect-error Subtype override
  data: Actor["data"] & { _source: { type: Type }; type: Type };

  async rollSave(save: string): Promise<void> {
    const roll = new Roll("1d20");
    await roll.roll({ async: true });
    const flavor = `Rolling Save`;
    roll.toMessage({ flavor, speaker: { actor: this.id } });
  }
}
