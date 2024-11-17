
const {
  SchemaField, NumberField, StringField, HTMLField
} = foundry.data.fields;

const attributeField = (label: string, initial = 1) => new NumberField({
  required: true, integer: true, min: 0, initial, label
});

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export class SkillData extends foundry.abstract.TypeDataModel<{}, Item, {}, {}> {
  static defineSchema() {
    return {
      rank: attributeField("Rank"),
      attribute: attributeField("Attribute"),
      ranks: new SchemaField({
        one: new StringField({ initial: "", required: true, label: "Rank 1" }),
        two: new StringField({ initial: "", required: true, label: "Rank 2" }),
        three: new StringField({ initial: "", required: true, label: "Rank 3" }),
        four: new StringField({ initial: "", required: true, label: "Rank 4" }),
      }),
      description: new StringField({ initial: "", label: "Description" }),
      notes: new HTMLField({ initial: "", label: "Notes" }),
    }
  }

  get config() {
    return {
      attributes: {
        0: "Grit",
        1: "Gait",
        2: "Grip",
        3: "Glim",
      }
    }
  }
}