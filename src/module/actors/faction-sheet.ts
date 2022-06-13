import { AllItemClasses } from "../item-types";
import { BaseActorSheet } from "../actor-base-sheet";
import { FACTION_TAGS, SWNRFactionActor } from "./faction";
import { FACTION_GOALS, FACTION_ACTIONS } from "./faction";
import { ValidatedDialog } from "../ValidatedDialog";

interface FactionActorSheetData extends ActorSheet.Data {
  itemTypes: SWNRFactionActor["itemTypes"];
  assets: AllItemClasses & { data: { type: "asset" } };
}
export class FactionActorSheet extends BaseActorSheet<FactionActorSheetData> {
  popUpDialog?: Dialog;

  get actor(): SWNRFactionActor {
    if (super.actor.type !== "faction") throw Error;
    return super.actor;
  }

  _injectHTML(html: JQuery<HTMLElement>): void {
    html
      .find(".window-content")
      .addClass(["cq", "overflow-y-scroll", "relative"]);
    super._injectHTML(html);
  }

  async _onAssetCreate(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const assetType = $(event.currentTarget).data("assetType");
    const givenName = $(event.currentTarget).data("assetName");
    const itemName = givenName ? `New ${givenName}` : "New Asset";
    const imgPath = this.getAssetImage(assetType);
    if (assetType) {
      await this.actor.createEmbeddedDocuments(
        "Item",
        [
          {
            name: itemName,
            type: "asset",
            img: imgPath,
            data: {
              assetType: assetType,
            },
          },
        ],
        {}
      );
    }
  }

  getAssetImage(itemType: string): string | null {
    const icon_path = "systems/swnr/assets/icons/hawkin";
    const imgMap = {
      cunning: "cunning.png",
      force: "force.png",
      wealth: "wealth.png",
    };
    if (itemType in imgMap) {
      return `${icon_path}/${imgMap[itemType]}`;
    } else {
      return "icons/svg/item-bag.svg";
    }
  }

  async getData(
    options?: Application.RenderOptions
  ): Promise<FactionActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;
    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
    });
  }

  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "faction"],
      template: "systems/swnr/templates/actors/faction-sheet.html",
      width: 750,
      height: 600,
      tabs: [
        {
          navSelector: ".pc-sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "assets",
        },
      ],
    });
  }

  async _onDelTag(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const div = $(event.currentTarget).parents(".tagdiv");
    const p = $(event.currentTarget).parents();
    const idx = div.data("idx");
    const tags = this.actor.data.data.tags;
    const tag = tags[idx];
    // if (!tag) {
    //   ui.notifications?.info("Issue deleting tag");
    //   return;
    // }
    const performDelete: boolean = await new Promise((resolve) => {
      Dialog.confirm({
        title: "Delete Tag",
        yes: () => resolve(true),
        no: () => resolve(false),
        content: `Remove tag ${tag.name}?`,
      });
    });
    if (!performDelete) return;
    div.slideUp(200, () => {
      requestAnimationFrame(async () => {
        //actor.removeCrew(li.data("crewId"));
        tags.splice(idx, 1);
        await this.actor.update({
          data: {
            tags: tags,
          },
        });
      });
    });
  }

  async _onAddTag(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    let tagOptions = "";
    let tagDesc = "";
    for (const tag of FACTION_TAGS) {
      tagOptions += `<option value='${tag.name}'>${tag.name}</option>`;
      tagDesc += `<div> <b>${tag.name}</b></div><div>${tag.desc}</div><div><i>Effect:</i> ${tag.effect}</div>`;
    }
    const dialogTemplate = `
    <div class="flex flex-col">
      <h1> Add Tag </h1>
      <div class="flex flexrow">
        Tag: <select id="tag"          
        class="px-1.5 border border-gray-800 bg-gray-400 bg-opacity-75 placeholder-blue-800 placeholder-opacity-75 rounded-md">
        ${tagOptions}
        </select>
      </div>
      ${tagDesc}
    </div>
    `;
    new Dialog({
      title: "Add Tag",
      content: dialogTemplate,
      buttons: {
        trade: {
          label: "Add Tag",
          callback: async (html: JQuery<HTMLElement>) => {
            const tag = (<HTMLSelectElement>html.find("#tag")[0]).value;
            this.actor.addTag(tag);
          },
        },
        close: {
          label: "Close",
        },
      },
      default: "trade",
    }).render(true);
  }

  async _onStartTurn(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.actor.startTurn();
    // Now ask about action
    const dialogData = {
      actions: FACTION_ACTIONS,
    };
    const template = "systems/swnr/templates/dialogs/faction-action.html";
    const html = renderTemplate(template, dialogData);
    const _form = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const action = (<HTMLSelectElement>form.querySelector('[name="action"]'))
        .value;
      for (const a of FACTION_ACTIONS) {
        if (action == a.name) {
          const title = `Faction ${this.actor.name} action: ${action}`;
          const msg = `${a.desc}`;
          const longDesc = a.longDesc != undefined ? a.longDesc : null;
          let roll: Roll | null = null;
          if (a.roll) {
            roll = new Roll(a.roll, this.actor.data.data);
          }
          this.actor.logMessage(title, msg, longDesc, roll);
        }
      }
    };

    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: "Take Action",
        content: await html,
        default: "setgoal",
        buttons: {
          setgoal: {
            label: "Take Action",
            callback: _form,
          },
        },
      },
      {
        classes: ["swnr"],
      }
    );
    this.popUpDialog.render(true);
  }

  async _onSetGoal(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const goalArray = FACTION_GOALS;
    const dialogData = {
      goalArray,
    };
    const template = "systems/swnr/templates/dialogs/faction-goal.html";
    const html = renderTemplate(template, dialogData);

    const _goalForm = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const goal = (<HTMLSelectElement>form.querySelector('[name="goal"]'))
        .value;
      const goalType = (<HTMLSelectElement>(
        form.querySelector('[name="goalType"]')
      )).value;

      if (goal && goal.length == 0 && goalType != "abandon") {
        ui.notifications?.info("No goal selected. Ignoring");
      } else {
        for (const g of FACTION_GOALS) {
          if (g.name == goal) {
            await this.actor.update({
              data: {
                factionGoal: g.name,
                factionGoalDesc: g.desc,
              },
            });
            let goalTypeMessage =
              "<b>Goal completed</b>.<br> Reminder: A faction that successfully accomplishes a goal gains experience points equal to the goal`s difficulty. This experience may be saved, or spent at the beginning of any turn to increase the Force, Cunning, or Wealth ratings of a faction. Optionally, the GM might allow a faction to buy a new tag if their deeds justify it.";

            if (goalType == "abandon") {
              goalTypeMessage =
                "<b>Goal abandoned.</b><br> Reminder: If a faction chooses to abandon a goal, the demoralizing effect of it and the waste of preparations costs them that turn’s FacCred income, and they cannot perform any other action that turn.";
            }
            const title = `Faction ${this.actor.name} changed their goal to ${g.name}.`;
            const content = `${goalTypeMessage}`;
            await this.actor.logMessage(title, content);
            return;
          }
        }
      }
    };

    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: "Set Goal",
        content: await html,
        default: "setgoal",
        buttons: {
          setgoal: {
            label: "Set Goal",
            callback: _goalForm,
          },
        },
      },
      {
        classes: ["swnr"],
      }
    );
    this.popUpDialog.render(true);
  }

  async _onAssetRepair(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = $(event.currentTarget).parents(".item");
    const asset = this.actor.getEmbeddedDocument(
      "Item",
      wrapper.data("itemId")
    );
    if (!asset) {
      ui.notifications?.error("Cannot find asset.");
      return;
    }
    ui.notifications?.info("on set _onAssetRepair " + asset.name);
  }

  async _onBaseAdd(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    new Dialog({
      title: "Add New Base",
      content: `
          Adding a new base from Expand Influence Action.<br>
          Select HP (up to Faction max HP). One FacCred per HP.
          <form>
            <div class="form-group">
              <label>Base HP</label>
              <input type='text' name='inputField'></input>
            </div>
          </form>`,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: `Exapnd Influence - New Base`,
        },
      },
      default: "yes",
      close: (html) => {
        const form = <HTMLFormElement>html[0].querySelector("form");
        const hp = (<HTMLInputElement>form.querySelector('[name="inputField"]'))
          ?.value;
        if (hp && hp != "") {
          const nHp = Number(hp);
          if (nHp) {
            const assetType = $(event.currentTarget).data("assetType");
            const givenName = $(event.currentTarget).data("assetName");
            const itemName = givenName
              ? `Base of Inf. ${givenName}`
              : "New Base of Inf";
            const imgPath = this.getAssetImage(assetType);
            this.actor.addBase(nHp, assetType, itemName, imgPath);
          } else {
            ui.notifications?.error(hp + " is not a number");
          }
        }
      },
    }).render(true);
  }

  async _onAssetUnusable(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = $(event.currentTarget).parents(".item");
    const asset = this.actor.getEmbeddedDocument(
      "Item",
      wrapper.data("itemId")
    );
    if (!asset) {
      ui.notifications?.error("Cannot find asset.");
      return;
    }
    const new_status = !asset?.data.data.unusable;
    if (asset instanceof Item)
      await asset?.update({
        data: {
          unusable: new_status,
        },
      });
  }

  async _onRatingUp(type: string): Promise<void> {
    return this.actor.ratingUp(type);
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html.find(".asset-create").on("click", this._onAssetCreate.bind(this));
    html.find(".faction-turn").on("click", this._onStartTurn.bind(this));
    html.find(".faction-tag-add").on("click", this._onAddTag.bind(this));
    html.find(".faction-tag-delete").on("click", this._onDelTag.bind(this));
    html.find(".force-up").on("click", this._onRatingUp.bind(this, "force"));
    html
      .find(".cunning-up")
      .on("click", this._onRatingUp.bind(this, "cunning"));
    html.find(".wealth-up").on("click", this._onRatingUp.bind(this, "wealth"));
    html.find(".set-goal").on("click", this._onSetGoal.bind(this));
    html.find(".item-fix").on("click", this._onAssetRepair.bind(this));
    html
      .find(".asset-toggle-unusable")
      .on("click", this._onAssetUnusable.bind(this));
    html.find(".add-base").on("click", this._onBaseAdd.bind(this));
    // html.find(".").on("click", this._on.bind(this));
  }
}

Hooks.on("dropActorSheetData", (actor: Actor, actorSheet: ActorSheet, data) => {
  if (data.type == "JournalEntry") {
    if (actor.type == "faction") {
      if (!data["id"] || typeof data["id"] !== "string") {
        ui.notifications?.error("Error with getting journal id");
        return;
      }
      const faction = (actor as unknown) as SWNRFactionActor;
      faction.setHomeWorld(data["id"]);
    }
  }
});

// A button to show long descriptions
Hooks.on(
  "renderChatMessage",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (message: ChatMessage, html: JQuery, _user: User) => {
    const longDesc = <JQuery<HTMLButtonElement>>html.find(".longShowDesc");
    if (longDesc) {
      const bind = function (event: JQuery.ClickEvent) {
        event.preventDefault();
        const hiddenDesc = <JQuery<HTMLDivElement>>html.find(".hiddenLong");
        hiddenDesc.show();
        longDesc.hide();
      };
      longDesc.one("click", bind);
    }
  }
);

export const sheet = FactionActorSheet;
export const types = ["faction"];
