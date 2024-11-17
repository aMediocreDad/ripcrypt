import { CharacterData } from "./data/hero.js";
import { GearData } from "./data/gear.js";
import { SkillData } from "./data/skill.js";
import { CharacterSheet } from "./applications/sheets/hero.js";
import { GearSheet } from "./applications/sheets/item.js";

Hooks.on("init", () => {
  console.log("RipCrypt | Initializing RipCrypt");
  CONFIG.Actor.dataModels.hero = CharacterData;
  CONFIG.Item.dataModels = {
    ammo: GearData,
    armor: GearData,
    gear: GearData,
    glim: SkillData,
    shield: GearData,
    skill: SkillData,
    weapon: GearData,
  }
  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: ["guts"],
      value: ["fate.glory"]
    }
  };
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);
  // @ts-expect-error - Type mismatch
  Actors.registerSheet("ripcrypt", CharacterSheet, {
    types: ["hero"],
    makeDefault: true,
  });
  // @ts-expect-error - Type mismatch
  Items.registerSheet("ripcrypt", GearSheet, {
    types: ["ammo", "armor", "gear", "glim", "shield", "skill", "weapon"],
    makeDefault: true,
  });
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Handlebars.registerHelper("includes", (array: any[], value: any) => array.includes(value));
  Handlebars.registerHelper("label", (value: string) => value.replace(/\b\w/g, (char) => char.toUpperCase()));
  Handlebars.registerHelper("add", (a: number, b: number) => a + b);
});