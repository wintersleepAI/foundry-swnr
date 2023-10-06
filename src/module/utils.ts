import {
  SWNRCharacterBaseData,
  SWNRCharacterComputedData,
} from "./actor-types";
import { SWNRCharacterActor } from "./actors/character";
import { SWNRNPCActor } from "./actors/npc";
import { SWNRBaseItem } from "./base-item";
import { SWNRArmor } from "./items/armor";
import { SWNRSkill } from "./items/skill";
import { ValidatedDialog } from "./ValidatedDialog";

export function chatListeners(message: ChatMessage, html: JQuery): void {
  html.on("click", ".card-buttons button", _onChatCardAction.bind(this));
  //Reroll
  html.find(".dice-roll").each((_i, div) => {
    _addRerollButton($(div));
  });
  // Health Buttons
  html.find(".roll-damage").each((_i, div) => {
    _addHealthButtons($(div));
  });
  //  html.on("click", ".item-name", _onChatCardToggleContent.bind(this));
  // Desc toggle
  const longDesc = <JQuery<HTMLButtonElement>>html.find(".longShowDesc");
  if (longDesc) {
    const bind = function (event: JQuery.ClickEvent) {
      event.preventDefault();
      const hiddenDesc = <JQuery<HTMLDivElement>>html.find(".hiddenLong");
      const shownDesc = <JQuery<HTMLDivElement>>html.find(".hiddenShort");
      hiddenDesc.show();
      //longDesc.hide();
      shownDesc.hide();
    };
    longDesc.on("click", bind);
  }
  const shortDesc = <JQuery<HTMLButtonElement>>html.find(".longHideDesc");
  if (shortDesc) {
    const bind = function (event: JQuery.ClickEvent) {
      event.preventDefault();
      const hiddenDesc = <JQuery<HTMLDivElement>>html.find(".hiddenLong");
      const shownDesc = <JQuery<HTMLDivElement>>html.find(".hiddenShort");
      hiddenDesc.hide();
      //longDesc.hide();
      shownDesc.show();
    };
    shortDesc.on("click", bind);
  }
}

function getRerollButton(
  diceRoll: string,
  isAttack: boolean
): JQuery<HTMLElement> {
  const rerollButton = $(
    `<button class="dice-total-fullDamage-btn chat-button-small"><i class="fas fa-redo" title="Reroll"></i></button>`
  );
  rerollButton.on("click", async (ev) => {
    const rollMode = game.settings.get("core", "rollMode");
    ev.stopPropagation();
    const roll = new Roll(diceRoll);
    await roll.roll({ async: true });
    const flavor = "Reroll";
    const chatTemplate = "systems/swnr/templates/chat/re-roll.html";
    const chatDialogData = {
      roll: await roll.render(),
      title: flavor,
      isAttack,
    };
    const chatContent = await renderTemplate(chatTemplate, chatDialogData);
    const chatData = {
      speaker: ChatMessage.getSpeaker(),
      roll: JSON.stringify(roll),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    getDocumentClass("ChatMessage").applyRollMode(chatData, rollMode);
    getDocumentClass("ChatMessage").create(chatData);
  });
  return rerollButton;
}

export function _addRerollButton(html: JQuery): void {
  const totalDiv = html.find(".dice-total");
  if (totalDiv.parent().parent().parent().hasClass("re-roll")) {
    // this is a re-roll do not add
    return;
  }

  const diceRoll = totalDiv.parent().find(".dice-formula").text();
  const total = parseInt(totalDiv.text());
  if (isNaN(total)) {
    console.log("Error in converting a string to a number " + totalDiv.text());
    return;
  }

  const btnContainer = $(
    '<span class="dmgBtn-container" style="position:absolute; right:0; bottom:1px;"></span>'
  );
  const rerollButton = getRerollButton(diceRoll, false);
  btnContainer.append(rerollButton);
  totalDiv.append(btnContainer);
}

export function _addHealthButtons(html: JQuery): void {
  const totalDiv = html.find(".dice-total");
  const total = parseInt(totalDiv.text());
  if (isNaN(total)) {
    console.log("Error in converting a string to a number " + totalDiv.text());
    return;
  }
  const diceRoll = totalDiv.parent().find(".dice-formula").text();

  const fullDamageButton = $(
    `<button class="dice-total-fullDamage-btn chat-button-small"><i class="fas fa-user-minus" title="Click to apply full damage to selected token(s)."></i></button>`
  );
  const halfDamageButton = $(
    `<button class="dice-total-halfDamage-btn chat-button-small"><i class="fas fa-user-shield" title="Click to apply half damage to selected token(s)."></i></button>`
  );
  // const doubleDamageButton = $(`<button class="dice-total-doubleDamage-btn" style="${btnStyling}"><i class="fas fa-user-injured" title="Click to apply double damage to selected token(s)."></i></button>`);
  const fullHealingButton = $(
    `<button class="dice-total-fullHealing-btn chat-button-small"><i class="fas fa-user-plus" title="Click to apply full healing to selected token(s)."></i></button>`
  );

  const fullDamageModifiedButton = $(
    `<button class="dice-total-fullDamageMod-btn chat-button-small"><i class="fas fa-user-edit" title="Click to apply full damage with modifier prompt to selected token(s)."></i></button>`
  );

  const btnContainer = $(
    '<span class="dmgBtn-container" style="position:absolute; right:0; bottom:1px;"></span>'
  );

  const rerollButton = getRerollButton(diceRoll, true);
  btnContainer.append(fullDamageButton);
  btnContainer.append(fullDamageModifiedButton);
  btnContainer.append(halfDamageButton);
  // btnContainer.append(doubleDamageButton);
  btnContainer.append(fullHealingButton);
  if (totalDiv.parent().parent().parent().hasClass("re-roll") == false) {
    btnContainer.append(rerollButton);
  }
  totalDiv.append(btnContainer);

  // Handle button clicks
  fullDamageButton.on("click", (ev) => {
    ev.stopPropagation();
    applyHealthDrop(total);
  });

  fullDamageModifiedButton.on("click", (ev) => {
    ev.stopPropagation();
    new Dialog({
      title: "Apply Modifier to Damage",
      content: `
          <form>
            <div class="form-group">
              <label>Modifier to damage (${total}) </label>
              <input type='text' name='inputField'></input>
            </div>
          </form>`,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: `Apply`,
        },
      },
      default: "yes",
      close: (html) => {
        const form = <HTMLFormElement>html[0].querySelector("form");
        const modifier = (<HTMLInputElement>(
          form.querySelector('[name="inputField"]')
        ))?.value;
        if (modifier && modifier != "") {
          const nModifier = Number(modifier);
          if (nModifier) {
            applyHealthDrop(total + nModifier);
          } else {
            ui.notifications?.error(modifier + " is not a number");
          }
        }
      },
    }).render(true);
  });

  halfDamageButton.on("click", (ev) => {
    ev.stopPropagation();
    applyHealthDrop(Math.floor(total * 0.5));
  });

  // doubleDamageButton.click(ev => {
  //     ev.stopPropagation();
  // applyHealthDrop(total*2);
  // });

  fullHealingButton.on("click", (ev) => {
    ev.stopPropagation();
    applyHealthDrop(total * -1);
  });
}

export async function showValueChange(
  t: Token,
  fillColor: string,
  total: number
): Promise<void> {
  const floaterData = {
    anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
    direction:
      total > 0
        ? CONST.TEXT_ANCHOR_POINTS.BOTTOM
        : CONST.TEXT_ANCHOR_POINTS.TOP,
    // duration: 2000,
    fontSize: 32,
    fill: fillColor,
    stroke: 0x000000,
    strokeThickness: 4,
    jitter: 0.3,
  };

  if (game?.release?.generation >= 10)
    canvas?.interface?.createScrollingText(
      t.center,
      `${total * -1}`,
      floaterData
    );
  // v10
  else t.hud.createScrollingText(`${total * -1}`, floaterData); // v9
}

export async function applyHealthDrop(total: number): Promise<void> {
  if (total == 0) return; // Skip changes of 0

  const tokens = canvas?.tokens?.controlled;
  if (!tokens || tokens.length == 0) {
    ui.notifications?.error("Please select at least one token");
    return;
  }
  // console.log(
  //   `Applying health drop ${total} to ${tokens.length} selected tokens`
  // );

  for (const t of tokens) {
    const actor = t.actor;
    if (!actor) {
      ui.notifications?.error("Error getting actor for token " + t.name);
      continue;
    }
    if (game.settings.get("swnr", "useCWNArmor")) {
      const armorWithSoak = <SWNRBaseItem<"armor">[]>(
        actor.items.filter(
          (i) =>
            i.data.type === "armor" &&
            i.data.data.use &&
            i.data.data.location === "readied" &&
            i.data.data.soak.value > 0
        )
      );
      for (const armor of armorWithSoak) {
        if (total > 0) {
          const soakValue = armor.data.data.soak.value;
          const newSoak = Math.max(soakValue - total, 0);
          total -= soakValue - newSoak;
          await armor.update({ "data.soak.value": newSoak });
          await showValueChange(t, "0xFFA500", soakValue - newSoak);
        }
      }
    }
    const oldHealth = actor.data.data.health.value;
    if (total != 0) {
      let newHealth = oldHealth - total;
      if (newHealth < 0) {
        newHealth = 0;
      } else if (newHealth > actor.data.data.health.max) {
        newHealth = actor.data.data.health.max;
      }
      //console.log(`Updating ${actor.name} health to ${newHealth}`);
      await actor.update({ "data.health.value": newHealth });
      // Taken from Mana
      //https://gitlab.com/mkahvi/fvtt-micro-modules/-/blob/master/pf1-floating-health/floating-health.mjs#L182-194
      const fillColor = total < 0 ? "0x00FF00" : "0xFF0000";
      showValueChange(t, fillColor, total);

      let isDefeated = false;
      if (newHealth <= 0) {
        isDefeated = true;
      } else if (oldHealth <= 0) {
        // token was at <=0 and now is not
        isDefeated = false;
      } else {
        // we can return no status to update
        return;
      }
      await t.combatant?.update({ defeated: isDefeated });
      const status = CONFIG.statusEffects.find(
        (e) => e.id === CONFIG.specialStatusEffects.DEFEATED
      );
      if (!status) return;
      const effect = actor && status ? status : CONFIG.controlIcons.defeated;
      if (t.object) {
        await t.object.toggleEffect(effect, {
          overlay: true,
          active: isDefeated,
        });
      } else {
        await t.toggleEffect(effect, {
          overlay: true,
          active: isDefeated,
        });
      }
    }
  }
}

export function _findCharTargets(): (SWNRCharacterActor | SWNRNPCActor)[] {
  const chars: (SWNRCharacterActor | SWNRNPCActor)[] = [];
  canvas?.tokens?.controlled.forEach((i) => {
    if (i.actor?.type == "character" || i.actor?.type == "npc") {
      chars.push(i.actor);
    }
  });
  if (
    game.user?.character?.type == "character" ||
    game.user?.character?.type == "npc"
  ) {
    chars.push(game.user.character);
  }
  return chars;
}

//Taken from WWN (which could have come from OSE)
export async function _onChatCardAction(
  event: JQuery.ClickEvent
): Promise<void> {
  event.preventDefault();

  // Extract card data
  const button = event.currentTarget;
  //button.disabled = true;
  const card = button.closest(".chat-card");
  //const messageId = card.closest(".message").dataset.messageId;
  //const message = game.messages?.get(messageId);
  const action = button.dataset.action;

  // Validate permission to proceed with the roll
  const targets = _findCharTargets();
  if (action === "save") {
    if (!targets.length) {
      ui.notifications?.warn(
        `You must have one or more controlled Tokens in order to use this option.`
      );
      //return (button.disabled = false);
    }
    for (const t of targets) {
      await t.rollSave(button.dataset.save);
    }
  } else if (action === "skill") {
    if (!targets.length) {
      ui.notifications?.warn(
        `You must have one or more controlled Tokens in order to use this option.`
      );
      //return (button.disabled = false);
    }
    let skill = button.dataset.skill;
    let stat = null;
    if (skill.indexOf("/") != -1) {
      stat = skill.split("/")[0].toLowerCase();
      skill = skill.split("/")[1];
    }
    for (const t of targets) {
      if (t.type == "npc") {
        const skill = t.data.data.skillBonus;
        const roll = new Roll("2d6 + @skill", { skill });
        await roll.roll({ async: true });
        const flavor = game.i18n.format(
          game.i18n.localize("swnr.npc.skill.trained"),
          { actor: t.name }
        );
        roll.toMessage({ flavor, speaker: { actor: t } });
      } else {
        const candidates = t.itemTypes.skill.filter(
          (i) => i.name?.toLocaleLowerCase() === skill.toLocaleLowerCase()
        );
        if (candidates.length == 1) {
          if (candidates[0].type == "skill") {
            if (stat == null || stat === "ask") {
              // No stat given or written as ask. Use roll default.
              candidates[0].roll(false);
            } else {
              // Stat given force the roll
              const skillItem = <SWNRSkill>(
                (<SWNRBaseItem<"skill">>candidates[0])
              );
              const dice =
                skillItem.data.data.pool === "ask"
                  ? "2d6"
                  : skillItem.data.data.pool;
              const skillRank = skillItem.data.data.rank;

              const statShortName = game.i18n.localize(
                "swnr.stat.short." + stat
              );
              let statData = {
                mod: 0,
              };

              if (t.data.data["stats"][stat])
                statData = t.data.data["stats"][stat];

              skillItem.rollSkill(
                skillItem.name,
                statShortName,
                statData.mod,
                dice,
                skillRank,
                0
              );
            }
          }
        } else {
          ui.notifications?.info(`Cannot find skill ${skill}`);
        }
      }
    }
  } else if (action === "effort") {
    if (!targets.length) {
      ui.notifications?.warn(
        `You must have one or more controlled Tokens in order to use this option.`
      );
      //return (button.disabled = false);
    }
    const effort = button.dataset.effort;

    for (const t of targets) {
      if (t.type === "character") {
        if (t.data.data.effort.value == 0) {
          ui.notifications?.info(`${t.name} has no available effort`);
          return;
        }
        const updated_effort = t.data.data.effort[effort] + 1;
        const effort_key = `data.effort.${effort}`;
        await t.update({ [effort_key]: updated_effort });
      }
    }
  }
}

export function getDefaultImage(itemType: string): string | null {
  const icon_path = "systems/swnr/assets/icons/game-icons.net/item-icons";
  const imgMap = {
    shipWeapon: "sinusoidal-beam.svg",
    shipDefense: "bubble-field.svg",
    shipFitting: "power-generator.svg",
    cyberware: "cyber-eye.svg",
    focus: "reticule.svg",
    armor: "armor-white.svg",
    weapon: "weapon-white.svg",
    power: "psychic-waves-white.svg",
    skill: "book-white.svg",
    edge: "edge.svg",
    program: "program.svg",
  };
  if (itemType in imgMap) {
    return `${icon_path}/${imgMap[itemType]}`;
  } else {
    return "icons/svg/item-bag.svg";
  }
}

export function calculateStats(
  stats: Merge<SWNRCharacterBaseData, SWNRCharacterComputedData>["stats"]
): void {
  for (const stat of Object.values(stats)) {
    stat.baseTotal = stat.base + stat.boost;
    stat.total = stat.baseTotal + stat.temp;
    const v = (stat.total - 10.5) / 3.5;
    stat.mod =
      Math.min(2, Math.max(-2, Math[v < 0 ? "ceil" : "floor"](v))) + stat.bonus;
  }
}

export function limitConcurrency<Callback extends (...unknown) => unknown>(
  fn: Callback
): Callback {
  let limited = false;
  return <Callback>async function (...args) {
    if (limited) {
      return;
    }
    limited = true;
    const r = await fn.apply(this, args);
    limited = false;
    return r;
  };
}

export async function initCompendSkills(
  actor: SWNRCharacterActor
): Promise<void> {
  const candidates: {
    [name: string]: CompendiumCollection<CompendiumCollection.Metadata>;
  } = {};
  for (const e of game.packs) {
    if (e.metadata.type === "Item") {
      const items = await e.getDocuments();
      if (items.filter((i) => (<SWNRBaseItem>i).type == "skill").length) {
        candidates[e.metadata.name] = e;
        console.log("skills", e.name, e.metadata, candidates);
      }
    }
  }
  if (Object.keys(candidates).length == 0) {
    ui.notifications?.error("Cannot find a compendium with a skill item");
    return;
  }
  let compOptions = "";
  for (const label in candidates) {
    const cand = candidates[label];
    compOptions += `<option value='${cand.metadata.name}'>${cand.metadata.label}</option>`;
  }
  const dialogTemplate = `
  <div class="flex flex-col -m-2 p-2 pb-4 space-y-2">
    <h1> Select Compendium </h1>
    <div class="flex flexrow">
      Compendium: <select id="compendium"
      class="px-1.5 border border-gray-800 bg-gray-400 bg-opacity-75 placeholder-blue-800 placeholder-opacity-75 rounded-md">
      ${compOptions}
      </select>
    </div>
  </div>
  `;

  const popUpDialog = new ValidatedDialog(
    {
      title: "Add Skills",
      content: dialogTemplate,
      buttons: {
        addSkills: {
          label: "Add Skills",
          callback: async (html: JQuery<HTMLElement>) => {
            const comped = (<HTMLSelectElement>html.find("#compendium")[0])
              .value;
            const toAdd = await candidates[comped].getDocuments();
            const primarySkills = toAdd
              .filter((i) => i.data.type === "skill")
              .map((item) => item.toObject())
              .sort((a, b) => {
                if (a.name < b.name) {
                  return -1;
                }
                if (a.name > b.name) {
                  return 1;
                }
                return 0;
              });
            await actor.createEmbeddedDocuments("Item", primarySkills);
          },
        },
        close: {
          label: "Close",
        },
      },
      default: "addSkills",
    },
    {
      failCallback: () => {
        return;
      },
      classes: ["swnr"],
    }
  );
  const s = popUpDialog.render(true);
  if (s instanceof Promise) await s;
}

export function initSkills(
  actor: SWNRCharacterActor,
  skillSet: keyof typeof skills
): void {
  const items = skills[skillSet].map((element) => {
    const skillRoot = `swnr.skills.${skillSet}.${element}.`;
    return {
      type: "skill",
      name: game.i18n.localize(skillRoot + "name"),
      data: {
        rank: -1,
        pool: "ask",
        description: game.i18n.localize(skillRoot + "text"),
        source: game.i18n.localize("swnr.skills.labels." + skillSet),
        dice: "2d6",
      },
    };
  });
  actor.createEmbeddedDocuments("Item", items);
}
const skills = {
  none: <Array<string>>[],
  spaceMagic: ["knowMagic", "useMagic", "sunblade", "fight"],
  classic: [
    "artist",
    "athletics",
    "bureaucracy",
    "business",
    "combat-energy",
    "combat-gunnery",
    "combat-primitive",
    "combat-projectile",
    "combat-psitech",
    "combat-unarmed",
    "computer",
    "culture-alien",
    "culture-criminal",
    "culture-spacer",
    "culture-traveller",
    "culture",
    "culture",
    "culture",
    "exosuit",
    "gambling",
    "history",
    "instructor",
    "language",
    "leadership",
    "navigation",
    "perception",
    "persuade",
    "profession",
    "religion",
    "science",
    "security",
    "stealth",
    "steward",
    "survival",
    "tactics",
    "tech-astronautic",
    "tech-maltech",
    "tech-medical",
    "tech-postech",
    "tech-pretech",
    "tech-psitech",
    "vehicle-air",
    "vehicle-grav",
    "vehicle-land",
    "vehicle-space",
    "vehicle-water",
  ],
  revised: [
    "administer",
    "connect",
    "exert",
    "fix",
    "heal",
    "know",
    "lead",
    "notice",
    "perform",
    "pilot",
    "program",
    "punch",
    "shoot",
    "sneak",
    "stab",
    "survive",
    "talk",
    "trade",
    "work",
  ],
  psionic: [
    "biopsionics",
    "metapsionics",
    "precognition",
    "telekinesis",
    "telepathy",
    "teleportation",
  ],
};
