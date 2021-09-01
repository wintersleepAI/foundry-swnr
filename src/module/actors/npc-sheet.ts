import { SWNRNPCActor } from "./npc";
import { SWNRWeapon } from "../items/weapon";
import { SWNRBaseItem } from "../base-item";
import { AllItemClasses } from "../item-types";

interface NPCActorSheetData extends ActorSheet.Data {
  itemTypes: SWNRNPCActor["itemTypes"];
  abilities: AllItemClasses & { data: { type: "power" | "focus" } };
  equipment: AllItemClasses & {
    data: { type: "armor" | "item" | "weapon" };
  };
}
export class NPCActorSheet extends ActorSheet<
  ActorSheet.Options,
  NPCActorSheetData
> {
  popUpDialog?: Dialog;
  get actor(): SWNRNPCActor {
    if (super.actor.type !== "npc") throw Error;
    return super.actor;
  }

  _injectHTML(html: JQuery<HTMLElement>): void {
    html
      .find(".window-content")
      .addClass(["cq", "overflow-y-scroll", "relative"]);
    super._injectHTML(html);
  }

  async getData(
    options?: Application.RenderOptions
  ): Promise<NPCActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;
    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
      abilities: this.actor.items.filter(
        (i: SWNRBaseItem) => ["power", "focus"].indexOf(i.data.type) !== -1
      ),
      equipment: this.actor.items.filter(
        (i: SWNRBaseItem) =>
          ["armor", "item", "weapon"].indexOf(i.data.type) !== -1
      ),
    });
  }
  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "npc"],
      template: "systems/swnr/templates/actors/npc-sheet.html",
      width: 750,
      height: 600,
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html.find(".item-edit").on("click", this._onItemEdit.bind(this));
    html.find(".item-delete").on("click", this._onItemDelete.bind(this));
    html
      .find(".weapon.item .item-name")
      .on("click", this._onItemDamage.bind(this));
    html.find(".reaction").on("click", this._onReaction.bind(this));
    html.find(".morale").on("click", this._onMorale.bind(this));
    html.find(".skill").on("click", this._onSkill.bind(this));
    html.find(".saving-throw").on("click", this._onSavingThrow.bind(this));
    html.find(".hit-dice-roll").on("click", this._onHitDice.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      // Find all items on the character sheet.
      html.find('.item').each((i, li) => {
        // Ignore for the header row.
        if (li.classList.contains("item-header")) return;
        // Add draggable attribute and dragstart listener.
        li.setAttribute("draggable", "true");
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  _onItemEdit(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", wrapper.data("itemId"));
    if (item instanceof Item) item.sheet?.render(true);
  }

  async _onItemDelete(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
    if (!item) return;
    const performDelete: boolean = await new Promise((resolve) => {
      Dialog.confirm({
        title: game.i18n.format("swnr.deleteTitle", { name: item.name }),
        yes: () => resolve(true),
        no: () => resolve(false),
        content: game.i18n.format("swnr.deleteContent", {
          name: item.name,
          actor: this.actor.name,
        }),
      });
    });
    if (!performDelete) return;
    li.slideUp(200, () => {
      requestAnimationFrame(() => {
        this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
      });
    });
  }
  async _onItemDamage(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const id = event.currentTarget.parentElement.dataset.itemId;
    const weapon = this.actor.getEmbeddedDocument("Item", id);
    if (!weapon) {
      console.error(`The item ID ${id} does not exist.`);
      return;
    } else if (!(weapon instanceof SWNRWeapon)) {
      console.error(`The item named ${weapon.name} is not a weapon.`);
      return;
    }

    const template = await renderTemplate(
      "systems/swnr/templates/dialogs/roll-attack.html",
      { actor: this.actor.data, weapon, burstFireHasAmmo: weapon.canBurstFire }
    );
    const doRoll = async (html: JQuery<HTMLElement>) => {
      const skill = html.find('[name="skilled"]').prop("checked")
        ? this.actor.data.data.skillBonus
        : 0;
      const modifier = parseInt(html.find('[name="modifier"]').val() as string);
      const burstMode =
        html.find('[name="burstFire"]')?.prop("checked") ?? false;
      const attackBonus = this.actor.data.data.ab;
      const damageBonus = this.actor.data.data.attacks.bonusDamage;
      console.log({ skill, modifier, burstMode, attackBonus, damageBonus });

      await weapon.rollAttack(damageBonus, 0, skill, modifier, burstMode);
    };
    this.popUpDialog?.close();
    this.popUpDialog = new Dialog(
      {
        title: game.i18n.format("swnr.dialog.attackRoll", {
          actorName: this.actor.name,
          weaponName: weapon.name,
        }),
        content: template,
        default: "roll",
        buttons: {
          roll: {
            label: "Roll",
            icon: '<i class="fa fa-dice-d20"></i>',
            callback: doRoll,
          },
        },
      },
      { classes: ["swnr"] }
    );
    this.popUpDialog.render(true);
  }

  async _onReaction(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    function defineResult(
      text: string,
      range: [number, number]
    ): {
      text: string;
      weight: number;
      range: [number, number];
      type: 0;
      flags: { swnr: { type: string } };
      _id: string;
    } {
      return {
        text: game.i18n.localize("swnr.npc.reaction." + text),
        type: 0,
        range,
        flags: { swnr: { type: text.toLocaleLowerCase() } },
        weight: 1 + range[1] - range[0],
        _id: text.toLocaleLowerCase().padEnd(16, "0"),
      };
    }
    const tableResults = [
      defineResult("hostile", [2, 2]),
      defineResult("negative", [3, 5]),
      defineResult("neutral", [6, 8]),
      defineResult("positive", [9, 11]),
      defineResult("friendly", [12, 12]),
    ];

    const rollTable = (await RollTable.create(
      {
        name: "NPC Reaction",
        description: " ", //todo: spice this up
        formula: "2d6",
        results: tableResults,
      },
      { temporary: true }
    )) as RollTable;

    const { results } = await rollTable.draw();

    await this.actor.update({
      "data.reaction": results[0].id?.split("0")[0],
    });

    // force re-render
    this.render();
  }

  // Set the max/value health based on D8 hit dice
  _onHitDice(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.actor.rollHitDice();
  }

  _onMorale(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const roll = new Roll("2d6").roll();
    console.log(roll);
    const flavor =
      +(roll.terms[0]?.total ?? 0) > this.actor.data.data.moralScore
        ? game.i18n.localize("swnr.npc.morale.failure")
        : game.i18n.localize("swnr.npc.morale.success");
    roll.toMessage({ flavor, speaker: { actor: this.actor.id } });
  }

  _onSavingThrow(event: JQuery.ClickEvent): void {
    event.stopPropagation();
    event.preventDefault();

    const roll = new Roll("1d20").roll();
    const flavor = game.i18n.format(
      parseInt(roll.result) >= this.actor.data.data.saves
        ? game.i18n.localize("swnr.npc.saving.success")
        : game.i18n.localize("swnr.npc.saving.failure"),
      { actor: this.actor.name }
    );

    roll.toMessage({ flavor, speaker: { actor: this.actor._id } });
  }

  _onSkill(event: JQuery.ClickEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const trained = event.currentTarget.dataset.skillType === "trained";
    const skill = trained ? this.actor.data.data.skillBonus : 0;

    const roll = new Roll("2d6 + @skill", { skill }).roll();
    const flavor = game.i18n.format(
      trained
        ? game.i18n.localize("swnr.npc.skill.trained")
        : game.i18n.localize("swnr.npc.skill.untrained"),
      { actor: this.actor.name }
    );
    roll.toMessage({ flavor, speaker: { actor: this.actor._id } });
  }

  /** @override */
  async _updateObject(
    event: Event,
    formData: Record<string, number | string>
  ): Promise<SWNRNPCActor> {
    this._itemEditHandler(formData);
    super._updateObject(event, formData);
    return this.actor;
  }
  _itemEditHandler(formData: Record<string, number | string>): void {
    const itemUpdates = {};
    Object.keys(formData)
      .filter((k) => k.startsWith("items."))
      .forEach((k) => {
        const value = formData[k];
        delete formData[k];
        const broken = k.split(".");
        const id = broken[1];
        const update = broken.splice(2).join(".");
        if (!itemUpdates[id]) itemUpdates[id] = { _id: id };
        itemUpdates[id][update] = value;
      });
    for (const key in itemUpdates) {
      if (Object.prototype.hasOwnProperty.call(itemUpdates, key)) {
        const element = itemUpdates[key];
        this.actor.updateEmbeddedDocuments("Item", [element]);
      }
    }
  }
}
export const sheet = NPCActorSheet;
export const types = ["npc"];
