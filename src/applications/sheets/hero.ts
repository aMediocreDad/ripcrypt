import { get } from "svelte/store";
import { HelpersMixin } from "../mixins/sheet.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

export class CharacterSheet extends HelpersMixin(HandlebarsApplicationMixin(ActorSheetV2)) {
  static override PARTS = {
    form: {
      template: "systems/ripcrypt/templates/hero.hbs"
    }
  }

  static override DEFAULT_OPTIONS = {
    actions: {
      editItem: this._onEditItem,
      rollAttribute: this._onRollAttribute,
    },
    classes: ["ripcrypt", "hero"],
    position: {
      height: 700,
      width: 700,
    }
  };

  static _onEditItem(event: Event) {
    // @ts-expect-error - Shite HTML typing
    const { uuid } = event.target.closest("[data-uuid]").dataset;

    if (!uuid) { return; }

    // @ts-expect-error - Missing property
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    const item = this.document.items.get(uuid.split(".").at(-1));
    if (!item) { return; }

    item.sheet?.render(true);
  }

  static async _onRollAttribute(event: Event) {
    // @ts-expect-error - HTML typing bullshit
    const getNumber = (e: Event, selector) => Number.parseInt(e.target?.closest("form").querySelector<HTMLSelectElement | HTMLInputElement>(selector)?.value, 10);

    // @ts-expect-error - Shite HTML typing
    const { attribute } = event.target.closest("[data-attribute]").dataset;

    if (!attribute) { return; }

    const attributeName = attribute.at(0).toUpperCase() + attribute.slice(1);

    // @ts-expect-error - Missing property
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    const { attributes } = this.document.system;
    const n = attributes[attribute];

    const {
      difficulty,
      extraDice,
    } = await DialogV2.wait({
      // @ts-expect-error - Type mismatch
      window: { title: "Roll Difficulty", contentClasses: ["ripcrypt", "dialog"] },
      position: { width: 400 },
      content: `<p>Enter the difficulty for the ${attributeName} roll...</p>
      <label>Difficulty</label>
      <select name="difficulty">
        <option value="4">Easy</option>
        <option value="5" selected>Normal</option>
        <option value="6">Tough</option>
        <option value="7">Hard</option>
      </select>
      <label>Add or Subtract Dice</label>
      <input type="number" name="extraDice" value="0" />
      `,
      buttons: [
        {
          label: "Roll", action: "roll", callback: async (event) => ({
            difficulty: getNumber(event, "[name=difficulty]"),
            extraDice: getNumber(event, "[name=extraDice]")
          })
        },
        {
          label: "Drag", action: "drag", callback: async (event) => ({
            difficulty: getNumber(event, "[name=difficulty]") + 1,
            extraDice: getNumber(event, "[name=extraDice]")
          })
        },
        {
          label: "Edge", action: "edge", callback: async (event) => ({
            difficulty: getNumber(event, "[name=difficulty]") - 1,
            extraDice: getNumber(event, "[name=extraDice]")
          })
        },
      ]
    });

    new Roll(`${n + extraDice}d8x8x1cs>=${difficulty}df1`, {}, {
      // @ts-expect-error - Missing property
      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      flavor: `${this.document.name} rolls ${attributeName} + ${extraDice} against ${difficulty}`,
    }).roll().then(r => r.toMessage());
  }

  // @ts-expect-error - Type mismatch
  override async _prepareContext() {
    // @ts-ignore - Infinite type recursion
    const equippedWeapons = this.actor.items.filter((item) => item.type === "weapon" && !!item.system.equipped);
    // @ts-expect-error - Type mismatch
    const weapons = this.actor.system.config.weaponSlots.map((_, i) => {
      return equippedWeapons[i] || null;
    });

    // @ts-ignore - Infinite type recursion
    const equippedArmor = this.actor.items.filter((item) => ["armor", "shield"].includes(item.type) && !!item.system.equipped);
    const armor = {
      // @ts-expect-error - Type mismatch
      head: equippedArmor.find((item) => item.system.locations.includes('head')) || null,
      // @ts-expect-error - Type mismatch
      body: equippedArmor.find((item) => item.system.locations.includes('body')) || null,
      // @ts-expect-error - Type mismatch
      arms: equippedArmor.find((item) => item.system.locations.includes('arms')) || null,
      // @ts-expect-error - Type mismatch
      legs: equippedArmor.find((item) => item.system.locations.includes('legs')) || null,
      shield: equippedArmor.find((item) => item.type === "shield") || null,
    }

    return {
      actor: this.actor,
      // @ts-ignore - Infinite type recursion
      armor,
      enriched: {
        system: {
          notes: await TextEditor.enrichHTML(this.actor.system.notes as string, { secrets: this.actor.isOwner })
        }
      },
      gear: this.actor.items.filter((item) => ["ammo", "armor", "gear", "shield", "weapon"].includes(item.type) && !item.system.equipped),
      skills: {
        grit: this.actor.items.filter((item) => item.type === "skill" && item.system.attribute === 0),
        gait: this.actor.items.filter((item) => item.type === "skill" && item.system.attribute === 1),
        grip: this.actor.items.filter((item) => item.type === "skill" && item.system.attribute === 2),
        glim: this.actor.items.filter((item) => item.type === "skill" && item.system.attribute === 3),
      },
      system: this.actor.system,
      weapons,
    };
  }

  _onRender() {
    const items = this.element.querySelectorAll('[data-uuid]')
    for (const el of items) {
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        // @ts-expect-error - Shite HTML typing
        const { uuid } = el.dataset;

        if (!uuid) { return; }

        const item = this.document.items.get(uuid.split(".").at(-1));
        if (!item) { return; }

        this.#deleteItem(item);
      })
    }

    for (const d of this._dragDrop) {
      d.bind(this.element);
    }
  }

  override async _onDrop(event: DragEvent): Promise<void> {
    const target = event.target;
    const data = TextEditor.getDragEventData(event);
    if (!data || typeof data !== 'object' || !('type' in data) || data.type !== "Item") {
      return;
    }


    // @ts-expect-error - Type mismatch
    const item = await Item.fromDropData(data);

    if (!item) { return; }

    const actorHasItem = this.actor.items.get(item.id || '');

    if (actorHasItem)
      await this.#updateItem(target, item);
    else
      await this.#addItem(item);
  }

  async #addItem(item: Item) {
    // @ts-expect-error - Type mismatch
    await this.actor.createEmbeddedDocuments("Item", [item]);
  }

  async #updateItem(target: EventTarget | null, item: Item) {
    if (!(target instanceof HTMLElement)) { return; }

    // @ts-expect-error - HTML typing bullshit
    const dropType = target.closest("[data-drop-type]")?.dataset.dropType;
    switch (dropType) {
      case "weapon":
        await this.#equipItem(item, ["weapon"]);
        break;
      case "armor":
        await this.#equipItem(item, ["armor", "shield"]);
        break;
      case "gear":
        await this.#equipItem(item, ["gear"]);
        break;
      default:
    }
  }

  async #equipItem(item: Item, type: string[]) {
    if (!["armor", "shield", "weapon"].includes(item.type)) { return; }

    const shouldUnequip = !item.system.equipped || type.includes("gear");
    const toEquip = type.includes(item.type) ? true : !shouldUnequip;

    await this.actor.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.equipped": toEquip }]);
  }

  async #deleteItem(item: Item) {
    DialogV2.confirm({
      // @ts-expect-error - Type mismatch
      window: { title: "Delete Item" },
      content: `<p>Do you wish to delete ${item.name}?</p>`,
      modal: true,
      defaultYes: false,
    }).then((yes) => { yes && this.actor.deleteEmbeddedDocuments("Item", [item.id || '']) })
  }
}