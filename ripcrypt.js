var P = Object.defineProperty;
var v = (a) => {
  throw TypeError(a);
};
var U = (a, e, t) => e in a ? P(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var m = (a, e, t) => U(a, typeof e != "symbol" ? e + "" : e, t), V = (a, e, t) => e.has(a) || v("Cannot " + t);
var x = (a, e, t) => e.has(a) ? v("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(a) : e.set(a, t);
var p = (a, e, t) => (V(a, e, "access private method"), t);
const {
  HTMLField: W,
  SchemaField: w,
  NumberField: N,
  StringField: nt
} = foundry.data.fields, c = (a, e = 0) => new N({
  required: !0,
  integer: !0,
  min: 0,
  initial: e,
  label: a
}), j = (a) => new w({
  value: c("Value"),
  max: c("Max")
}, {
  label: a
}), z = (a) => a.type === "armor" && a.system.equipped && a.system.weight === 2, B = (a) => ["armor", "shield", "weapon"].includes(a.type) && !a.system.equipped || ["ammo", "gear"].includes(a.type);
class J extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      advances: new w({
        grit: c("Grit"),
        gait: c("Gait"),
        grip: c("Grip"),
        glim: c("Glim")
      }),
      guts: new N({ initial: 5, min: 0 }),
      aura: j("Aura"),
      resources: new w({
        gold: c("Gold"),
        silver: c("Silver"),
        copper: c("Copper")
      }),
      fate: new w({
        direction: c("Direction", 0),
        rank: c("Rank", 0),
        glory: c("Glory", 0)
      }, { label: "Fate" }),
      notes: new W({ initial: "", label: "Notes" })
    };
  }
  get armor() {
    const e = this.parent.items.filter((t) => ["armor", "shield"].includes(t.type) && !!t.system.equipped);
    return {
      // @ts-expect-error - Type mismatch
      head: e.reduce((t, s) => s.system.locations.includes("head") ? s.system.value : t, 0),
      // @ts-expect-error - Type mismatch
      body: e.reduce((t, s) => s.system.locations.includes("body") ? s.system.value : t, 0),
      // @ts-expect-error - Type mismatch
      arms: e.reduce((t, s) => s.system.locations.includes("arms") ? s.system.value : t, 0),
      // @ts-expect-error - Type mismatch
      legs: e.reduce((t, s) => s.system.locations.includes("legs") ? s.system.value : t, 0)
    };
  }
  get attributes() {
    const { direction: e } = this.fate, t = this.config.directionsToAttributes[e];
    return {
      // @ts-expect-error - missing property
      grit: 1 + this.advances.grit + (t === "Grit" ? 1 : 0),
      // @ts-expect-error - missing property
      gait: 1 + this.advances.gait + (t === "Gait" ? 1 : 0),
      // @ts-expect-error - missing property
      grip: 1 + this.advances.grip + (t === "Grip" ? 1 : 0),
      // @ts-expect-error - missing property
      glim: 1 + this.advances.glim + (t === "Glim" ? 1 : 0)
    };
  }
  get config() {
    return {
      directions: {
        0: "N",
        1: "E",
        2: "S",
        3: "W"
      },
      directionsToAttributes: {
        0: "Grit",
        1: "Gait",
        2: "Grip",
        3: "Glim"
      },
      ranks: {
        0: "Novice",
        1: "Adept",
        2: "Master",
        3: "Legend"
      },
      weaponSlots: [
        null,
        null,
        null,
        null
      ]
    };
  }
  get fateAttribute() {
    return this.config.directionsToAttributes[this.fate.direction];
  }
  get gutsMax() {
    return Object.values(this.attributes).reduce((t, s) => t + s, 0);
  }
  get load() {
    const { items: e } = this.parent, t = e.filter(z).length, s = t > 3 ? 2 : t ? 1 : 0, n = e.filter(B).length > 12 ? 1 : 0;
    return s + n;
  }
  get move() {
    return 3 + this.attributes.gait - this.load;
  }
  get run() {
    return 6 + this.attributes.gait * 2 - this.load;
  }
}
const {
  SchemaField: Q,
  NumberField: A,
  StringField: _,
  BooleanField: Y,
  ArrayField: q
} = foundry.data.fields, h = (a, e = 1) => new A({
  required: !0,
  integer: !0,
  min: 0,
  initial: e,
  label: a
}), E = (a) => new Q({
  value: h("Value", 0),
  max: h("Max", 0)
}, {
  label: a
}), K = (a) => {
  var e;
  return ((e = a.at(0)) == null ? void 0 : e.toUpperCase()) + a.slice(1);
};
class f extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // Ammo
      quantity: h("Quantity"),
      // Armor
      locations: new q(new _({ initial: "", required: !0 })),
      value: h("Value"),
      // Weapon
      damage: new A({ initial: 1, min: 0 }),
      range: E("Range"),
      traits: new q(new _({ initial: "", required: !0 })),
      wear: E("Wear"),
      weight: h("Weight"),
      // Common
      access: new A({ initial: 0, min: 0, max: 4, label: "Access" }),
      cost: h("Cost (sp)"),
      equipped: new Y({ initial: !1 })
    };
  }
  get config() {
    return {
      locations: ["head", "body", "arms", "legs"],
      access: {
        0: "Common",
        1: "Uncommon",
        2: "Rare",
        3: "Scarce"
      },
      weight: {
        0: "Light",
        2: "Modest",
        3: "Heavy"
      },
      traits: ["able", "agile", "ammo", "crude", "long", "thrown"]
    };
  }
  get renderedTraits() {
    return this.traits.filter((e) => e).map((e) => K(e)).join(", ");
  }
}
const {
  SchemaField: X,
  NumberField: Z,
  StringField: b,
  HTMLField: tt
} = foundry.data.fields, H = (a, e = 1) => new Z({
  required: !0,
  integer: !0,
  min: 0,
  initial: e,
  label: a
});
class M extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      rank: H("Rank"),
      attribute: H("Attribute"),
      ranks: new X({
        one: new b({ initial: "", required: !0, label: "Rank 1" }),
        two: new b({ initial: "", required: !0, label: "Rank 2" }),
        three: new b({ initial: "", required: !0, label: "Rank 3" }),
        four: new b({ initial: "", required: !0, label: "Rank 4" })
      }),
      description: new b({ initial: "", label: "Description" }),
      notes: new tt({ initial: "", label: "Notes" })
    };
  }
  get config() {
    return {
      attributes: {
        0: "Grit",
        1: "Gait",
        2: "Grip",
        3: "Glim"
      }
    };
  }
}
const R = (a) => {
  var e, t, $;
  return e = class extends a {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    constructor(...i) {
      const [l = {}] = i;
      super(l);
      x(this, t);
      m(this, "_dragDrop");
      this._dragDrop = p(this, t, $).call(this);
    }
    get dragDrop() {
      return this._dragDrop;
    }
    _canDragStart() {
      return this.isEditable;
    }
    _canDragDrop() {
      return this.isEditable;
    }
    async _onDragStart(i) {
      var g;
      const l = i.currentTarget;
      if (!l || !(l instanceof HTMLElement))
        return;
      let u = null;
      if (l.dataset.uuid) {
        const o = await fromUuid(l.dataset.uuid);
        if (!o)
          return;
        u = o.toDragData();
      }
      u && ((g = i.dataTransfer) == null || g.setData("text/plain", JSON.stringify(u)));
    }
    _onDragOver(i) {
    }
    async _onDrop(i) {
    }
    _onRender() {
      for (const i of this._dragDrop)
        i.bind(this.element);
    }
    static async _onEditImage(i) {
      var o;
      const l = (o = i.target) == null ? void 0 : o.dataset.edit, u = foundry.utils.getProperty(this.document, l);
      await new FilePicker({
        current: u,
        type: "image",
        callback: (S) => {
          this.document.update({ img: S });
        },
        // @ts-expect-error - document is not defined
        // biome-ignore lint/complexity/noThisInStatic: <explanation>
        top: this.position.top + 40,
        // @ts-expect-error - document is not defined
        // biome-ignore lint/complexity/noThisInStatic: <explanation>
        left: this.position.left + 10
      }).browse();
    }
  }, t = new WeakSet(), $ = function() {
    const { dragDrop: i } = this.options;
    return i.map((l) => (l.permissions = {
      dragstart: this._canDragStart.bind(this),
      drop: this._canDragDrop.bind(this)
    }, l.callbacks = {
      dragstart: this._onDragStart.bind(this),
      dragover: this._onDragOver.bind(this),
      drop: this._onDrop.bind(this)
    }, new DragDrop(l)));
  }, m(e, "DEFAULT_OPTIONS", {
    classes: ["ripcrypt"],
    actions: {
      editImage: e._onEditImage
    },
    sheetConfig: !1,
    window: {
      resizable: !0
    },
    form: {
      submitOnChange: !0
    },
    dragDrop: [{ dragSelector: "[data-uuid]", dropSelector: null }]
  }), e;
}, { ActorSheetV2: et } = foundry.applications.sheets, { HandlebarsApplicationMixin: it, DialogV2: G } = foundry.applications.api;
var d, L, O, D, C;
const y = class y extends R(it(et)) {
  constructor() {
    super(...arguments);
    x(this, d);
  }
  static _onEditItem(t) {
    var n;
    const { uuid: s } = t.target.closest("[data-uuid]").dataset;
    if (!s)
      return;
    const r = this.document.items.get(s.split(".").at(-1));
    r && ((n = r.sheet) == null || n.render(!0));
  }
  static async _onRollAttribute(t) {
    const s = (o, S) => {
      var k, I;
      return Number.parseInt((I = (k = o.target) == null ? void 0 : k.closest("form").querySelector(S)) == null ? void 0 : I.value, 10);
    }, { attribute: r } = t.target.closest("[data-attribute]").dataset;
    if (!r)
      return;
    const n = r.at(0).toUpperCase() + r.slice(1), { attributes: i } = this.document.system, l = i[r], {
      difficulty: u,
      extraDice: g
    } = await G.wait({
      // @ts-expect-error - Type mismatch
      window: { title: "Roll Difficulty", contentClasses: ["ripcrypt", "dialog"] },
      position: { width: 400 },
      content: `<p>Enter the difficulty for the ${n} roll...</p>
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
          label: "Roll",
          action: "roll",
          callback: async (o) => ({
            difficulty: s(o, "[name=difficulty]"),
            extraDice: s(o, "[name=extraDice]")
          })
        },
        {
          label: "Drag",
          action: "drag",
          callback: async (o) => ({
            difficulty: s(o, "[name=difficulty]") + 1,
            extraDice: s(o, "[name=extraDice]")
          })
        },
        {
          label: "Edge",
          action: "edge",
          callback: async (o) => ({
            difficulty: s(o, "[name=difficulty]") - 1,
            extraDice: s(o, "[name=extraDice]")
          })
        }
      ]
    });
    new Roll(`${l + g}d8x8x1cs>=${u}df1`, {}, {
      // @ts-expect-error - Missing property
      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      flavor: `${this.document.name} rolls ${n} + ${g} against ${u}`
    }).roll().then((o) => o.toMessage());
  }
  // @ts-expect-error - Type mismatch
  async _prepareContext() {
    const t = this.actor.items.filter((i) => i.type === "weapon" && !!i.system.equipped), s = this.actor.system.config.weaponSlots.map((i, l) => t[l] || null), r = this.actor.items.filter((i) => ["armor", "shield"].includes(i.type) && !!i.system.equipped), n = {
      // @ts-expect-error - Type mismatch
      head: r.find((i) => i.system.locations.includes("head")) || null,
      // @ts-expect-error - Type mismatch
      body: r.find((i) => i.system.locations.includes("body")) || null,
      // @ts-expect-error - Type mismatch
      arms: r.find((i) => i.system.locations.includes("arms")) || null,
      // @ts-expect-error - Type mismatch
      legs: r.find((i) => i.system.locations.includes("legs")) || null,
      shield: r.find((i) => i.type === "shield") || null
    };
    return {
      actor: this.actor,
      // @ts-ignore - Infinite type recursion
      armor: n,
      enriched: {
        system: {
          notes: await TextEditor.enrichHTML(this.actor.system.notes, { secrets: this.actor.isOwner })
        }
      },
      gear: this.actor.items.filter((i) => ["ammo", "armor", "gear", "shield", "weapon"].includes(i.type) && !i.system.equipped),
      skills: {
        grit: this.actor.items.filter((i) => i.type === "skill" && i.system.attribute === 0),
        gait: this.actor.items.filter((i) => i.type === "skill" && i.system.attribute === 1),
        grip: this.actor.items.filter((i) => i.type === "skill" && i.system.attribute === 2),
        glim: this.actor.items.filter((i) => i.type === "skill" && i.system.attribute === 3)
      },
      system: this.actor.system,
      weapons: s
    };
  }
  _onRender() {
    const t = this.element.querySelectorAll("[data-uuid]");
    for (const s of t)
      s.addEventListener("contextmenu", (r) => {
        r.preventDefault(), r.stopImmediatePropagation();
        const { uuid: n } = s.dataset;
        if (!n)
          return;
        const i = this.document.items.get(n.split(".").at(-1));
        i && p(this, d, C).call(this, i);
      });
    for (const s of this._dragDrop)
      s.bind(this.element);
  }
  async _onDrop(t) {
    const s = t.target, r = TextEditor.getDragEventData(t);
    if (!r || typeof r != "object" || !("type" in r) || r.type !== "Item")
      return;
    const n = await Item.fromDropData(r);
    if (!n)
      return;
    this.actor.items.get(n.id || "") ? await p(this, d, O).call(this, s, n) : await p(this, d, L).call(this, n);
  }
};
d = new WeakSet(), L = async function(t) {
  await this.actor.createEmbeddedDocuments("Item", [t]);
}, O = async function(t, s) {
  var n;
  if (!(t instanceof HTMLElement))
    return;
  switch ((n = t.closest("[data-drop-type]")) == null ? void 0 : n.dataset.dropType) {
    case "weapon":
      await p(this, d, D).call(this, s, ["weapon"]);
      break;
    case "armor":
      await p(this, d, D).call(this, s, ["armor", "shield"]);
      break;
    case "gear":
      await p(this, d, D).call(this, s, ["gear"]);
      break;
  }
}, D = async function(t, s) {
  if (!["armor", "shield", "weapon"].includes(t.type))
    return;
  const r = !t.system.equipped || s.includes("gear"), n = s.includes(t.type) ? !0 : !r;
  await this.actor.updateEmbeddedDocuments("Item", [{ _id: t.id, "system.equipped": n }]);
}, C = async function(t) {
  G.confirm({
    // @ts-expect-error - Type mismatch
    window: { title: "Delete Item" },
    content: `<p>Do you wish to delete ${t.name}?</p>`,
    modal: !0,
    defaultYes: !1
  }).then((s) => {
    s && this.actor.deleteEmbeddedDocuments("Item", [t.id || ""]);
  });
}, m(y, "PARTS", {
  form: {
    template: "systems/ripcrypt/templates/hero.hbs"
  }
}), m(y, "DEFAULT_OPTIONS", {
  actions: {
    editItem: y._onEditItem,
    rollAttribute: y._onRollAttribute
  },
  classes: ["ripcrypt", "hero"],
  position: {
    height: 700,
    width: 700
  }
});
let F = y;
const { ItemSheetV2: at } = foundry.applications.sheets, { HandlebarsApplicationMixin: st } = foundry.applications.api;
class T extends R(st(at)) {
  // @ts-expect-error - Type mismatch
  async _prepareContext() {
    return {
      enriched: {
        system: {
          notes: await TextEditor.enrichHTML(this.item.system.notes, { secrets: this.item.isOwner })
        }
      },
      item: this.item,
      system: this.item.system
    };
  }
}
m(T, "PARTS", {
  form: {
    template: "systems/ripcrypt/templates/item.hbs"
  }
}), m(T, "DEFAULT_OPTIONS", {
  position: {
    height: 400
  }
});
Hooks.on("init", () => {
  console.log("RipCrypt | Initializing RipCrypt"), CONFIG.Actor.dataModels.hero = J, CONFIG.Item.dataModels = {
    ammo: f,
    armor: f,
    gear: f,
    glim: M,
    shield: f,
    skill: M,
    weapon: f
  }, CONFIG.Actor.trackableAttributes = {
    character: {
      bar: ["guts"],
      value: ["fate.glory"]
    }
  }, Actors.unregisterSheet("core", ActorSheet), Items.unregisterSheet("core", ItemSheet), Actors.registerSheet("ripcrypt", F, {
    types: ["hero"],
    makeDefault: !0
  }), Items.registerSheet("ripcrypt", T, {
    types: ["ammo", "armor", "gear", "glim", "shield", "skill", "weapon"],
    makeDefault: !0
  }), Handlebars.registerHelper("includes", (a, e) => a.includes(e)), Handlebars.registerHelper("label", (a) => a.replace(/\b\w/g, (e) => e.toUpperCase())), Handlebars.registerHelper("add", (a, e) => a + e);
});
//# sourceMappingURL=ripcrypt.js.map
