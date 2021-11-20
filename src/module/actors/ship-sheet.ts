import { SWNRShipActor } from "./ship";
import { ValidatedDialog } from "../ValidatedDialog";
import { SWNRBaseItem } from "../base-item";
import { SWNRNPCActor } from "./npc";
import { SWNRCharacterActor } from "./character";
import { SysToFail } from "./ship";
import { VehicleBaseActorSheet } from "../vehicle-base-sheet";
import { ACTIONS } from "../ship-combat-actions";

interface ShipActorSheetData extends ActorSheet.Data {
  shipWeapons?: Item[];
  crewMembers?: string[]; // ActorIds
  itemTypes: SWNRShipActor["itemTypes"];
}

export class ShipActorSheet extends VehicleBaseActorSheet<ShipActorSheetData> {
  object: SWNRShipActor;

  get actor(): SWNRShipActor {
    if (super.actor.type != "ship") throw Error;
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
  ): Promise<ShipActorSheetData> {
    let data = super.getData(options);
    if (data instanceof Promise) data = await data;

    const crewArray: Array<SWNRCharacterActor | SWNRNPCActor> = [];
    if (this.actor.data.data.crewMembers) {
      for (let i = 0; i < this.actor.data.data.crewMembers.length; i++) {
        const cId = this.actor.data.data.crewMembers[i];
        const crewMember = game.actors?.get(cId);
        if (
          crewMember &&
          (crewMember.type == "character" || crewMember.type == "npc")
        ) {
          crewArray.push(crewMember);
          //console.log(crewArray);
        }
      }
      //console.log("CA", crewArray);
    } else {
      //console.log("no crewmembers");
    }

    return mergeObject(data, {
      itemTypes: this.actor.itemTypes,
      abilities: this.actor.items.filter(
        (i: SWNRBaseItem) => ["power", "focus"].indexOf(i.data.type) !== -1
      ),
      equipment: this.actor.items.filter(
        (i: SWNRBaseItem) =>
          ["armor", "item", "weapon"].indexOf(i.data.type) !== -1
      ),
      crewArray: crewArray,
      actions: ACTIONS,
    });
  }
  static get defaultOptions(): ActorSheet.Options {
    return mergeObject(super.defaultOptions, {
      classes: ["swnr", "sheet", "actor", "ship"],
      template: "systems/swnr/templates/actors/ship-sheet.html",
      width: 950,
      height: 600,
      tabs: [
        {
          navSelector: ".pc-sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "mods",
        },
      ],
    });
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html.find(".travel-button").on("click", this._onTravel.bind(this));
    html.find(".spike-button").on("click", this._onSpike.bind(this));
    html.find(".refuel-button").on("click", this._onRefuel.bind(this));
    html.find(".crisis-button").on("click", this._onCrisis.bind(this));
    html.find(".failure-button").on("click", this._onSysFailure.bind(this));
    html.find(".repair-button").on("click", this._onRepair.bind(this));
    html.find(".calc-cost").on("click", this._onCalcCost.bind(this));
    html.find(".make-payment").on("click", this._onPayment.bind(this));
    html.find(".pay-maintenance").on("click", this._onMaintenance.bind(this));
    html
      .find("[name='shipActions']")
      .on("change", this._onShipAction.bind(this));
    html
      .find("[name='data.shipHullType']")
      .on("change", this._onHullChange.bind(this));
    html
      .find(".resource-list-val")
      .on("change", this._onResourceName.bind(this));
    html
      .find(".resource-delete")
      .on("click", this._onResourceDelete.bind(this));
    html
      .find(".resource-create")
      .on("click", this._onResourceCreate.bind(this));
  }

  async _onResourceName(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const value = event.target?.value;
    const resourceType = $(event.currentTarget).data("rlType");
    const idx = $(event.currentTarget).parents(".item").data("rlIdx");
    const resourceList = duplicate(this.actor.data.data.cargoCarried);
    resourceList[idx][resourceType] = value;
    await this.actor.update({ "data.cargoCarried": resourceList });
  }

  async _onResourceDelete(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const idx = $(event.currentTarget).parents(".item").data("rlIdx");
    const resourceList = duplicate(this.actor.data.data.cargoCarried);
    resourceList.splice(idx, 1);
    await this.actor.update({ "data.cargoCarried": resourceList });
  }

  async _onResourceCreate(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    //console.log("Changing HP Max" , this.actor);
    let resourceList = this.actor.data.data.cargoCarried;
    if (!resourceList) {
      resourceList = [];
    }
    resourceList.push({ name: "Cargo X", value: 0, max: 1 });
    await this.actor.update({
      "data.cargoCarried": resourceList,
    });
  }

  _onPayment(event: JQuery.ClickEvent): void {
    return this._onPay(event, "payment");
  }

  _onMaintenance(event: JQuery.ClickEvent): void {
    return this._onPay(event, "maintenance");
  }

  _onPay(
    event: JQuery.ClickEvent,
    paymentType: "payment" | "maintenance"
  ): void {
    // if a new payment type is added this function needs to be refactored
    let shipPool = this.actor.data.data.creditPool;
    const paymentAmount =
      paymentType == "payment"
        ? this.actor.data.data.paymentAmount
        : this.actor.data.data.maintenanceCost;
    //Assume its payment and change if maintenance

    const lastPayDate =
      paymentType == "payment"
        ? this.actor.data.data.lastPayment
        : this.actor.data.data.lastMaintenance;
    const monthSchedule =
      paymentType == "payment"
        ? this.actor.data.data.paymentMonths
        : this.actor.data.data.maintenanceMonths;

    if (paymentAmount > shipPool) {
      ui.notifications?.error(
        `Not enough money in the pool for paying ${paymentAmount} for ${paymentType}`
      );
      return;
    }
    shipPool -= paymentAmount;
    const dateObject = new Date(
      lastPayDate.year,
      lastPayDate.month - 1,
      lastPayDate.day
    );
    dateObject.setMonth(dateObject.getMonth() + monthSchedule);
    if (paymentType == "payment") {
      this.actor.update({
        data: {
          creditPool: shipPool,
          lastPayment: {
            year: dateObject.getFullYear(),
            month: dateObject.getMonth() + 1,
            day: dateObject.getDate(),
          },
        },
      });
    } else {
      this.actor.update({
        data: {
          creditPool: shipPool,
          lastMaintenance: {
            year: dateObject.getFullYear(),
            month: dateObject.getMonth() + 1,
            day: dateObject.getDate(),
          },
        },
      });
    }
  }

  _onShipAction(event: JQuery.ClickEvent): void {
    event.preventDefault();
    const actionName = event.target?.value;
    if (actionName === "") {
      return;
    }
    const action = ACTIONS[actionName];
    if (!action) {
      ui.notifications?.error("There was an error in looking up your action");
      return;
    }
    const actionTitle = action.title ? action.title : actionName;
    let cp = this.actor.data.data.commandPoints;
    const actionsTaken = this.actor.data.data.actionsTaken
      ? this.actor.data.data.actionsTaken
      : [];
    if (action.limit === "round" && actionsTaken.indexOf(actionName) >= 0) {
      ui.notifications?.info(
        "Already taken the action this round. Did you forget to end the last round?"
      );
      return;
    }
    //endRound action is special. clear and reset.
    if (actionName == "endRound") {
      const newCp = this.actor.data.data.npcCommandPoints
        ? this.actor.data.data.npcCommandPoints
        : 0;
      let actionsText =
        actionsTaken.length > 0 ? `Actions: <ul>` : "No actions.";

      if (actionsTaken.length > 0) {
        for (const act of actionsTaken) {
          const actTitle =
            ACTIONS[act] && ACTIONS[act].title ? ACTIONS[act].title : act;
          actionsText += `<li>${actTitle}</li>`;
        }
        actionsText += "</ul>";
      }
      const chatData = {
        content: `Round ended for ${this.actor.name}. Setting CP to ${newCp}<br>${actionsText}`,
      };
      actionsTaken.length = 0;
      this.actor.update({
        data: { commandPoints: newCp, actionsTaken: actionsTaken },
      });
      event.target.value = "";
      ChatMessage.create(chatData);
      return;
    }
    //Verify enough CP
    if (action.cp && action.cp < 0 && cp + action.cp < 0) {
      ui.notifications?.error("Not enough command points");
      return;
    }
    const noteText = action.note ? action.note : "";
    const diffText = action.dc ? `<br>Difficulty:${action.dc}` : "";
    const descText = action.desc ? action.desc : "";
    if (action.skill) {
      // this action needs a skill roll
      let skillLevel = -1;
      let attrMod = 0;
      let attrName = "";
      let dicePool = "2d6";

      if (action.dept) {
        let foundActor = false; //might not be anyone in this dept/role
        if (this.actor.data.data.roles[action.dept] != "") {
          const defaultActor = game.actors?.get(
            this.actor.data.data.roles[action.dept]
          );
          if (defaultActor) {
            foundActor = true;
            if (defaultActor.type == "character") {
              for (const skill of defaultActor.itemTypes.skill) {
                if (action.skill == skill.data.name) {
                  skillLevel = skill.data.data["rank"];
                  dicePool =
                    skill.data.data["pool"] && skill.data.data["pool"] != "ask"
                      ? skill.data.data["pool"]
                      : "2d6";
                }
              }
              let tempMod = -2;
              if (action.attr) {
                //Find the attribute with the highest mod
                for (const attr of action.attr) {
                  if (
                    defaultActor.data.data.stats[attr] &&
                    defaultActor.data.data.stats[attr].mod > tempMod
                  ) {
                    tempMod = defaultActor.data.data.stats[attr].mod;
                    const key = `swnr.stat.short.${attr}`;
                    attrName = `${game.i18n.localize(key)}\\`;
                  }
                }
                attrMod = tempMod;
              }
            }
            if (defaultActor.type == "npc") {
              skillLevel = defaultActor.data.data.skillBonus;
            }
            // Roll skill, show name, skill, attr if != ""
            const rollMode = game.settings.get("core", "rollMode");
            const formula = `${dicePool} + @skillLevel + @attrMod`;
            const roll = new Roll(formula, {
              skillLevel,
              attrMod,
            });
            roll.roll();
            const title = `<span title="${descText}">Rolling ${actionTitle} ${attrName}${action.skill} for ${defaultActor.name}<br>${noteText}${diffText}</span>`;
            roll.toMessage(
              {
                speaker: ChatMessage.getSpeaker(),
                flavor: title,
              },
              { rollMode }
            );
          }
        }
        if (!foundActor) {
          // We are here means there is a skill but we don't know who it is for
          skillLevel = this.actor.data.data.crewSkillBonus
            ? this.actor.data.data.crewSkillBonus
            : 0;
          const rollMode = game.settings.get("core", "rollMode");
          const formula = `${dicePool} + @skillLevel`;
          const roll = new Roll(formula, {
            skillLevel,
            attrMod,
          });
          roll.roll();
          const title = `<span title="${descText}">Rolling ${actionTitle} ${attrName}${action.skill}. No PC/NPC set to role/dept.<br>${noteText}${diffText}</span>`;
          roll.toMessage(
            {
              speaker: ChatMessage.getSpeaker(),
              flavor: title,
            },
            { rollMode }
          );
        }
      }
    } else {
      // there is no skill
      const chatData = {
        content: `<span title="${descText}">${this.actor.name} ${actionTitle}<br><span class="flavor-text message-header" style="font-size:12px;">${noteText}${diffText}</span></span>`,
      };
      ChatMessage.create(chatData);
    }
    // Consume CP
    cp += action.cp;
    actionsTaken.push(actionName);
    this.actor.update({
      data: { commandPoints: cp, actionsTaken: actionsTaken },
    });
    event.target.value = "";
    return;
  }
  _onHullChange(event: JQuery.ClickEvent): void {
    const targetHull = event.target?.value;

    if (targetHull) {
      const d = new Dialog({
        title: "Apply Default Stats",
        content: `<p>Do you want to apply the default stats for a ${targetHull}?</p><b>This will change your current and max values for HP, cost, armor, AC, mass, power, hardpoints, hull type, speed, life support (60*max crew), and crew.</b>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: "Yes",
            callback: () => this.actor.applyDefaulStats(targetHull),
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: "No",
            callback: () => {
              console.log("Doing Nothing ");
            },
          },
        },
        default: "no",
      });
      d.render(true);
    }
  }

  _onRepair(event: JQuery.ClickEvent): void {
    event.preventDefault();
    const data = this.actor.data.data;
    const hpToFix = data.health.max - data.health.value;
    const hpCosts = hpToFix * 1000;
    const shipInventory = <
      SWNRBaseItem<"shipDefense" | "shipWeapon" | "shipFitting">[]
    >this.actor.items.filter(
      (i) =>
        i.type === "shipDefense" ||
        i.type === "shipWeapon" ||
        i.type === "shipFitting"
    );

    const disabledParts = shipInventory.filter(
      (i) => i.data.data.broken == true && i.data.data.destroyed == false
    );
    const shipClass = this.actor.data.data.shipClass;

    let multiplier = 1;
    if (shipClass == "frigate") {
      multiplier = 10;
    } else if (shipClass == "cruiser") {
      multiplier = 25;
    } else if (shipClass == "capital") {
      multiplier = 100;
    }

    let disabledCosts = 0;
    const itemsToFix: string[] = [];
    for (let i = 0; i < disabledParts.length; i++) {
      const item = disabledParts[i];
      const itemCost = item.data.data.costMultiplier
        ? item.data.data.cost * multiplier
        : item.data.data.cost;
      disabledCosts += itemCost;
      itemsToFix.push(`${item.name} (${itemCost})`);
      item.update({ "data.broken": false });
    }
    const fullRepairCost = disabledCosts * 0.25;
    const totalCost = hpCosts + fullRepairCost;
    this.actor.update({ "data.health.value": data.health.max });
    if (totalCost > 0) {
      const itemList = itemsToFix.join("<br>");
      const content = `<h3>Ship Repaired</h3><b>Estimated Total Cost: ${totalCost}</b><br>HP points: ${hpToFix} cost: ${hpCosts}<br>Full Repair Costs: ${fullRepairCost} (25%/item cost). <br><br> Items Repaired (item full cost):<br> ${itemList} `;
      const chatData = {
        content: content,
      };
      ChatMessage.create(chatData);
    }
  }

  _onTravel(event: JQuery.ClickEvent): void {
    event.preventDefault();
    if (this.actor.data.data.spikeDrive.value <= 0) {
      ui.notifications?.error("Drive disabled.");
      return;
    }
    //TODO localize
    new Dialog({
      title: "Travel Days (Use life support)",
      content: `
          <form>
            <div class="form-group">
              <label>Days of Travel</label>
              <input type='text' name='inputField'></input>
            </div>
          </form>`,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: `Travel`,
        },
      },
      default: "yes",
      close: (html) => {
        const form = <HTMLFormElement>html[0].querySelector("form");
        const days = (<HTMLInputElement>(
          form.querySelector('[name="inputField"]')
        ))?.value;
        if (days && days != "") {
          const nDays = Number(days);
          if (nDays) {
            this.actor.useDaysOfLifeSupport(nDays);
          } else {
            ui.notifications?.error(days + " is not a number");
          }
        }
      },
    }).render(true);
  }

  async _onSpike(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    if (this.actor.data.data.fuel.value <= 0) {
      ui.notifications?.error("Out of fuel.");
      return;
    }
    if (this.actor.data.data.spikeDrive.value <= 0) {
      ui.notifications?.error("Drive disabled.");
      return;
    }
    let defaultPilotId: string | null = this.actor.data.data.roles.bridge;
    let defaultPilot: SWNRCharacterActor | SWNRNPCActor | null = null;
    if (defaultPilotId) {
      const _temp = game.actors?.get(defaultPilotId);
      if (_temp && (_temp.type == "character" || _temp.type == "npc")) {
        defaultPilot = _temp;
      }
    }
    const crewArray: Array<SWNRCharacterActor | SWNRNPCActor> = [];
    if (this.actor.data.data.crewMembers) {
      for (let i = 0; i < this.actor.data.data.crewMembers.length; i++) {
        const cId = this.actor.data.data.crewMembers[i];
        const crewMember = game.actors?.get(cId);
        if (
          crewMember &&
          (crewMember.type == "character" || crewMember.type == "npc")
        ) {
          crewArray.push(crewMember);
        }
      }
    }

    const title = game.i18n.format("swnr.dialog.spikeRoll", {
      actorName: this.actor?.name,
    });

    if (defaultPilot == null && crewArray.length > 0) {
      //There is no pilot. Use first crew as default
      defaultPilot = crewArray[0];
      defaultPilotId = crewArray[0].id;
    }
    if (defaultPilot?.type == "npc" && crewArray.length > 0) {
      //See if we have a non NPC to set as pilot to get skills and attr
      for (const char of crewArray) {
        if (char.type == "character") {
          defaultPilot = char;
          defaultPilotId = char.id;
          break;
        }
      }
    }

    const dialogData = {
      actor: this.actor.data,
      defaultSkill1: "Pilot",
      defaultSkill2: "Navigation",
      defaultStat: "int",
      pilot: defaultPilot,
      pilotId: defaultPilotId,
      crewArray: crewArray,
      baseDifficulty: 7,
    };

    const template = "systems/swnr/templates/dialogs/roll-spike.html";
    const html = renderTemplate(template, dialogData);

    const _rollForm = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const mod = parseInt(
        (<HTMLInputElement>form.querySelector('[name="modifier"]'))?.value
      );
      const pilotId = (<HTMLInputElement>form.querySelector('[name="pilotId"]'))
        ?.value;
      const pilot = pilotId ? game.actors?.get(pilotId) : null;
      const dice = (<HTMLSelectElement>form.querySelector('[name="dicepool"]'))
        .value;
      const skillName = (<HTMLSelectElement>(
        form.querySelector('[name="skill"]')
      ))?.value;
      const statName = (<HTMLSelectElement>form.querySelector('[name="stat"]'))
        ?.value;
      const difficulty = parseInt(
        (<HTMLInputElement>form.querySelector('[name="difficulty"]'))?.value
      );
      const travelDays = parseInt(
        (<HTMLInputElement>form.querySelector('[name="travelDays"]'))?.value
      );
      let skillMod = 0;
      let statMod = 0;
      let pilotName: string | null = "";
      if (pilot) {
        if (skillName) {
          // We need to look up by name
          for (const skill of pilot.itemTypes.skill) {
            if (skillName == skill.data.name) {
              skillMod =
                skill.data.data["rank"] < 0 ? -1 : skill.data.data["rank"];
            }
          }
        } //end skill
        if (statName) {
          const sm = pilot.data.data["stats"]?.[statName].mod;
          if (sm) {
            console.log("setting stat mod", sm);
            statMod = sm;
          }
        }
        pilotName = pilot.name;
      }
      this.actor.rollSpike(
        pilotId,
        pilotName,
        skillMod,
        statMod,
        mod,
        dice,
        difficulty,
        travelDays
      );
    };

    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: title,
        content: await html,
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.localize("swnr.chat.roll"),
            callback: _rollForm,
          },
        },
      },
      {
        classes: ["swnr"],
      }
    );
    this.popUpDialog.render(true);
  }

  _onRefuel(event: JQuery.ClickEvent): void {
    event.preventDefault();
    const data = this.actor.data.data;
    const daysToRefill = data.lifeSupportDays.max - data.lifeSupportDays.value;
    const fuelToRefill = data.fuel.max - data.fuel.value;
    const lifeCost = daysToRefill * 20;
    const fuelCost = fuelToRefill * 500;
    const totalCost = lifeCost + fuelCost;
    this.actor.update({
      "data.lifeSupportDays.value": data.lifeSupportDays.max,
      "data.fuel.value": data.fuel.max,
    });
    //ui.notifications?.info("Refuelled");
    const chatData = {
      content: `Refueled. Estimated refuel costs: <b>${totalCost}</b>. <br>${daysToRefill} of life support costs ${lifeCost} (20/day). <br> ${fuelToRefill} jumps cost ${fuelCost} (500/load).`,
    };
    if (totalCost > 0) {
      ChatMessage.create(chatData);
    }
  }

  _onCrisis(event: JQuery.ClickEvent): void {
    event.preventDefault();
    this.actor.rollCrisis();
  }

  async _onSysFailure(event: JQuery.ClickEvent): Promise<void> {
    event.preventDefault();
    const title = game.i18n.format("swnr.dialog.sysFailure", {
      actorName: this.actor?.name,
    });
    const dialogData = {};
    const template = "systems/swnr/templates/dialogs/roll-ship-failure.html";
    const html = renderTemplate(template, dialogData);

    const _rollForm = async (html: HTMLFormElement) => {
      const form = <HTMLFormElement>html[0].querySelector("form");
      const incDrive = (<HTMLInputElement>(
        form.querySelector('[name="inc-drive"]')
      ))?.checked
        ? true
        : false;
      const incWpn = (<HTMLInputElement>form.querySelector('[name="inc-wpn"]'))
        ?.checked
        ? true
        : false;
      const incFit = (<HTMLInputElement>form.querySelector('[name="inc-fit"]'))
        ?.checked
        ? true
        : false;
      const incDef = (<HTMLInputElement>form.querySelector('[name="inc-def"]'))
        ?.checked
        ? true
        : false;
      const whatToRoll = (<HTMLSelectElement>(
        form.querySelector('[name="what"]')
      ))?.value;

      const sysToInclude: SysToFail[] = [];
      if (incDrive) {
        sysToInclude.push("drive");
      }
      if (incWpn) {
        sysToInclude.push("wpn");
      }
      if (incFit) {
        sysToInclude.push("fit");
      }
      if (incDef) {
        sysToInclude.push("def");
      }
      this.actor.rollSystemFailure(sysToInclude, whatToRoll);
    };

    this.popUpDialog?.close();
    this.popUpDialog = new ValidatedDialog(
      {
        title: title,
        content: await html,
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.localize("swnr.chat.roll"),
            callback: _rollForm,
          },
        },
      },
      {
        classes: ["swnr"],
      }
    );
    this.popUpDialog.render(true);
  }

  _onCalcCost(event: JQuery.ClickEvent): void {
    event.preventDefault();
    const hullType = this.actor.data.data.shipHullType;
    const d = new Dialog({
      title: "Calc Costs",
      content: `Do you want to calculate the cost based on your fittings and the hull ${hullType}`,
      buttons: {
        yesnomaint: {
          icon: '<i class="fas fa-check"></i>',
          label: "Yes, but leave maintenance alone",
          callback: () => {
            this.actor.calcCost(false);
          },
        },
        yes: {
          icon: '<i class="fas fa-times"></i>',
          label: "Yes, and calculate maintence costs as 5%",
          callback: () => {
            this.actor.calcCost(true);
          },
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: "No",
          callback: () => {
            console.log("Doing nothing");
          },
        },
      },
      default: "no",
    });
    d.render(true);
  }
}

export const sheet = ShipActorSheet;
export const types = ["ship"];
