
const {
  SchemaField, NumberField, StringField, BooleanField, ArrayField
} = foundry.data.fields;

const attributeField = (label: string, initial = 1) => new NumberField({
  required: true, integer: true, min: 0, initial, label
});

const resourceField = (label: string) => new SchemaField({
  value: attributeField("Value", 0),
  max: attributeField("Max", 0),
}, {
  label
});

const toUpperCase = (str: string) => str.at(0)?.toUpperCase() + str.slice(1);

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export class GearData extends foundry.abstract.TypeDataModel<{}, Item, {}, {}> {
  static defineSchema() {
    return {
      // Ammo
      quantity: attributeField("Quantity"),
      // Armor
      locations: new ArrayField(new StringField({ initial: "", required: true })),
      value: attributeField("Value"),
      // Weapon
      damage: new NumberField({ initial: 1, min: 0 }),
      range: resourceField("Range"),
      traits: new ArrayField(new StringField({ initial: "", required: true })),
      wear: resourceField("Wear"),
      weight: attributeField("Weight"),
      // Common
      access: new NumberField({ initial: 0, min: 0, max: 4, label: "Access" }),
      cost: attributeField("Cost (sp)"),
      equipped: new BooleanField({ initial: false }),
    }
  }

  get config() {
    const locations = ["head", "body", "arms", "legs"];
    const access = {
      0: "Common",
      1: "Uncommon",
      2: "Rare",
      3: "Scarce",
    }
    const weight = {
      0: "Light",
      2: "Modest",
      3: "Heavy",
    }
    const traits = ["able", "agile", "ammo", "crude", "long", "thrown"];

    return {
      locations,
      access,
      weight,
      traits
    }
  }

  get renderedTraits() {
    // @ts-expect-error - missing property
    return this.traits.filter((s) => s).map((s) => toUpperCase(s)).join(", ")
  }
}