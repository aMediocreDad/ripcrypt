const {
  HTMLField, SchemaField, NumberField, StringField
} = foundry.data.fields;

const attributeField = (label: string, initial = 0) => new NumberField({
  required: true, integer: true, min: 0, initial, label
});

const resourceField = (label: string) => new SchemaField({
  value: attributeField("Value"),
  max: attributeField("Max"),
}, {
  label
});

const isHeavyArmor = (item: Item) =>
  item.type === "armor" && item.system.equipped && item.system.weight === 2;

const countsTowardsLoad = (item: Item) =>
  (["armor", "shield", "weapon"].includes(item.type) && !item.system.equipped) || ["ammo", "gear"].includes(item.type);

// biome-ignore lint/complexity/noBannedTypes: Necessary for the initialisation
export class CharacterData extends foundry.abstract.TypeDataModel<{}, Actor, {}, {}> {
  static defineSchema() {
    return {
      advances: new SchemaField({
        grit: attributeField("Grit"),
        gait: attributeField("Gait"),
        grip: attributeField("Grip"),
        glim: attributeField("Glim"),
      }),
      guts: new NumberField({ initial: 5, min: 0 }),
      aura: resourceField("Aura"),
      resources: new SchemaField({
        gold: attributeField("Gold"),
        silver: attributeField("Silver"),
        copper: attributeField("Copper"),
      }),
      fate: new SchemaField({
        direction: attributeField("Direction", 0),
        rank: attributeField("Rank", 0),
        glory: attributeField("Glory", 0),
      }, { label: "Fate" }),
      notes: new HTMLField({ initial: "", label: "Notes" }),
    }
  }

  get armor() {
    // @ts-ignore- Infinite type recursion
    const equippedArmor = this.parent.items.filter((item) => ["armor", "shield"].includes(item.type) && !!item.system.equipped);
    return {
      // @ts-expect-error - Type mismatch
      head: equippedArmor.reduce((acc, item) => item.system.locations.includes('head') ? item.system.value : acc, 0),
      // @ts-expect-error - Type mismatch
      body: equippedArmor.reduce((acc, item) => item.system.locations.includes('body') ? item.system.value : acc, 0),
      // @ts-expect-error - Type mismatch
      arms: equippedArmor.reduce((acc, item) => item.system.locations.includes('arms') ? item.system.value : acc, 0),
      // @ts-expect-error - Type mismatch
      legs: equippedArmor.reduce((acc, item) => item.system.locations.includes('legs') ? item.system.value : acc, 0)
    }
  }

  get attributes() {
    // @ts-expect-error - missing property
    const { direction } = this.fate;
    // @ts-expect-error - string index signature
    const attribute = this.config.directionsToAttributes[direction];
    return {
      // @ts-expect-error - missing property
      grit: 1 + this.advances.grit + (attribute === "Grit" ? 1 : 0),
      // @ts-expect-error - missing property
      gait: 1 + this.advances.gait + (attribute === "Gait" ? 1 : 0),
      // @ts-expect-error - missing property
      grip: 1 + this.advances.grip + (attribute === "Grip" ? 1 : 0),
      // @ts-expect-error - missing property
      glim: 1 + this.advances.glim + (attribute === "Glim" ? 1 : 0),
    }
  }

  get config() {
    const directions = {
      0: "N",
      1: "E",
      2: "S",
      3: "W"
    };

    const directionsToAttributes = {
      0: "Grit",
      1: "Gait",
      2: "Grip",
      3: "Glim"
    };

    const ranks = {
      0: "Novice",
      1: "Adept",
      2: "Master",
      3: "Legend"
    }

    const weaponSlots = [
      null,
      null,
      null,
      null,
    ]

    return {
      directions,
      directionsToAttributes,
      ranks,
      weaponSlots,
    }
  }

  get fateAttribute() {
    // @ts-expect-error - string index signature
    return this.config.directionsToAttributes[this.fate.direction];
  }

  get gutsMax() {
    const attributes = Object.values(this.attributes);
    return attributes.reduce((sum, value) => sum + value, 0);
  }

  get load() {
    const { items } = this.parent;
    // @ts-expect-error - Infinite type recursion
    const armorLoad = items.filter(isHeavyArmor).length;
    const armorPenalty = armorLoad > 3 ? 2 : armorLoad ? 1 : 0;

    const maxLoad = items.filter(countsTowardsLoad).length > 12;
    const loadPenlaty = maxLoad ? 1 : 0;

    return armorPenalty + loadPenlaty;
  }

  get move() {
    return 3 + this.attributes.gait - this.load;
  }

  get run() {
    return 6 + this.attributes.gait * 2 - this.load;
  }
}