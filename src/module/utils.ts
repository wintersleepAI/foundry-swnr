import {
  SWNRCharacterBaseData,
  SWNRCharacterComputedData,
} from "./actor-types";
import { SWNRCharacterActor } from "./actors/character";
import { SWNRNPCActor } from "./actors/npc";

export function chatListeners(message: MessageEvent, html: JQuery): void {
  html.on("click", ".card-buttons button", _onChatCardAction.bind(this));
  console.log(html);
  html.find(".roll-damage").each((_i, div) => {
    _addButton($(div));
  });
  //html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
}

export function _addButton(html: JQuery): void {
  let totalDiv = html.find(".dice-total"); 
  const total = totalDiv.text();
  let btnStyling = 'width: 22px; height:22px; font-size:10px;line-height:1px';

  const fullDamageButton = $(`<button class="dice-total-fullDamage-btn" style="${btnStyling}"><i class="fas fa-user-minus" title="Click to apply full damage to selected token(s)."></i></button>`);
  // const halfDamageButton = $(`<button class="dice-total-halfDamage-btn" style="${btnStyling}"><i class="fas fa-user-shield" title="Click to apply half damage to selected token(s)."></i></button>`);
  // const doubleDamageButton = $(`<button class="dice-total-doubleDamage-btn" style="${btnStyling}"><i class="fas fa-user-injured" title="Click to apply double damage to selected token(s)."></i></button>`);
  const fullHealingButton = $(`<button class="dice-total-fullHealing-btn" style="${btnStyling}"><i class="fas fa-user-plus" title="Click to apply full healing to selected token(s)."></i></button>`);

  const btnContainer = $('<span class="dmgBtn-container" style="position:absolute; right:0; bottom:1px;"></span>');
  btnContainer.append(fullDamageButton);
  // btnContainer.append(halfDamageButton);
  // btnContainer.append(doubleDamageButton);
  btnContainer.append(fullHealingButton);
  //console.log()

  totalDiv.append(btnContainer);

  // Handle button clicks
  fullDamageButton.click(ev => {
      ev.stopPropagation();
      console.log("changing " + total);
      //applyHealthDrop(total);
      //CONFIG.Actor.entityClass.applyDamage(html, 1);
  });
  
  // halfDamageButton.click(ev => {
  //     ev.stopPropagation();
  // applyHealthDrop(total*0.5);
  // });

  // doubleDamageButton.click(ev => {
  //     ev.stopPropagation();
  // applyHealthDrop(total*2);
  // });

  fullHealingButton.click(ev => {
      ev.stopPropagation();
      console.log("changing " + total);
      
      //applyHealthDrop(total*-1);
  });

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

export async function _onChatCardAction(
  event: JQuery.ClickEvent
): Promise<void> {
  event.preventDefault();

  // Extract card data
  const button = event.currentTarget;
  //button.disabled = true;
  const card = button.closest(".chat-card");
  const messageId = card.closest(".message").dataset.messageId;
  const message = game.messages?.get(messageId);
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
      await t.rollSave(button.dataset.save, { event });
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
    stat.total = stat.base + stat.boost + stat.temp;
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
