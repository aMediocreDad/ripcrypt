/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  AnyObject,
  EmptyObject,
} from "@league-of-foundry-developers/foundry-vtt-types/src/types/utils.d.mts";

import { SvelteDocumentSheet } from "./SvelteDocumentSheet.svelte.ts";

class SvelteActorSheet<
  D extends Actor.ConfiguredInstance = Actor.ConfiguredInstance,
  RenderContext extends AnyObject = EmptyObject,
  Configuration extends SvelteActorSheet.Configuration<
    D
  > = SvelteActorSheet.Configuration<D>,
  RenderOptions extends SvelteActorSheet.RenderOptions =
    SvelteActorSheet.RenderOptions,
> extends SvelteDocumentSheet<
  D,
  RenderContext,
  Configuration,
  RenderOptions
> {
  static override DEFAULT_OPTIONS = {
    position: {
      width: 600,
    },
    window: {
      controls: [
        {
          action: "configurePrototypeToken",
          icon: "fa-solid fa-user-circle",
          label: "TOKEN.TitlePrototype",
          ownership: "OWNER",
        },
        {
          action: "showPortraitArtwork",
          icon: "fa-solid fa-image",
          label: "SIDEBAR.CharArt",
          ownership: "OWNER",
        },
        {
          action: "showTokenArtwork",
          icon: "fa-solid fa-image",
          label: "SIDEBAR.TokenArt",
          ownership: "OWNER",
        },
      ],
    },
    actions: {
      configurePrototypeToken: SvelteActorSheet.#onConfigurePrototypeToken,
      showPortraitArtwork: SvelteActorSheet.#onShowPortraitArtwork,
      showTokenArtwork: SvelteActorSheet.#onShowTokenArtwork,
    },
  };

  /** The Actor document managed by this sheet. */
  get actor(): D {
    return this.document;
  }

  /* -------------------------------------------- */

  /**
   * If this sheet manages the ActorDelta of an unlinked Token, reference that Token document.
   */
  get token(): TokenDocument | null {
    // @ts-ignore Too Deep
    return this.document.token || null;
  }

  /* -------------------------------------------- */

  override _getHeaderControls() {
    const controls = this.options.window!.controls!;

    // Portrait image
    const { img } = this.actor;
    if (img === CONST.DEFAULT_TOKEN) {
      controls.findSplice((c) => c.action === "showPortraitArtwork");
    }

    // Token image
    const pt = this.actor.prototypeToken;
    const tex = pt.texture.src;
    // @ts-ignore
    if (pt.randomImg || [null, undefined, CONST.DEFAULT_TOKEN].includes(tex)) {
      controls.findSplice((c) => c.action === "showTokenArtwork");
    }
    return controls;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle header control button clicks to render the Prototype Token configuration sheet.
   * @this {ActorSheetV2}
   * @param {PointerEvent} event
   */
  static #onConfigurePrototypeToken(
    this: SvelteActorSheet,
    event: PointerEvent,
  ) {
    event.preventDefault();
    const renderOptions = {
      left: Math.max(this.position.left - 560 - 10, 10),
      top: this.position.top,
    };

    // eslint-disable-next-line new-cap
    new CONFIG.Token.prototypeSheetClass(
      // @ts-expect-error
      this.actor.prototypeToken,
      renderOptions,
    ).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle header control button clicks to display actor portrait artwork.
   * @this {ActorSheetV2}
   * @param {PointerEvent} event
   */
  static #onShowPortraitArtwork(this: SvelteActorSheet, event: PointerEvent) {
    const { img, name, uuid } = this.actor;
    // @ts-expect-error
    new ImagePopout(img, { title: name, uuid }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle header control button clicks to display actor portrait artwork.
   * @this {ActorSheetV2}
   * @param {PointerEvent} event
   */
  static #onShowTokenArtwork(this: SvelteActorSheet, event: PointerEvent) {
    const { prototypeToken, name, uuid } = this.actor;
    // @ts-ignore
    new ImagePopout(prototypeToken.texture.src, { title: name, uuid }).render(
      true,
    );
  }

  /* -------------------------------------------- */
  /*  Custom Changes                              */
  /* -------------------------------------------- */
  _canDragStart() {
    return this.isEditable;
  }

  _canDragDrop() {
    return this.isEditable;
  }

  _onDragStart(event: DragStartEvent) {
    const target = event.currentTarget as HTMLLIElement;
    if (!target) return;

    // @ts-expect-error
    if ("link" in (event.target?.dataset ?? {})) return;

    // Create drag data
    let dragData;

    // Owned Items
    if (target.dataset.itemId) {
      const item = this.actor.items.get(target.dataset.itemId);
      dragData = item?.toDragData();
    }

    // Active Effect
    if (target.dataset.effectId) {
      const effect = this.actor.effects.get(target.dataset.effectId);
      dragData = effect?.toDragData();
    }

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer!.setData("text/plain", JSON.stringify(dragData));
  }

  protected override _attachFrameListeners() {
    super._attachFrameListeners();

    if (this.options.tag === "form") {
      this.element.addEventListener("drop", this._onDrop.bind(this));
    }
  }

  async _onDrop(event: DropEvent) {
    const data = TextEditor.getDragEventData(event) as unknown as Record<
      string,
      unknown
    >;
    const actor = this.document;

    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) return false;

    // Handle different data types
    switch (data.type) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
      default:
        return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _onDropActiveEffect(event, data) {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _onDropActor(event: DropEvent, data: Record<string, unknown>) {
    if (!this.document.isOwner) return false;
    return true;
  }

  async _onDropItem(event: DropEvent, data: Record<string, unknown>) {
    if (!this.document.isOwner) return false;

    // @ts-expect-error
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    // Handle item sorting within the same Actor
    if (this.document.uuid === item.actor?.uuid) {
      return this._onSortItem(event, itemData);
    }

    // Create the owned item
    return this._onDropItemCreate(itemData, event);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _onDropFolder(event, data) {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _onDropItemCreate(itemData, event: DropEvent) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.document.createEmbeddedDocuments("Item", itemData);
  }

  _onSortItem(event: DropEvent, itemData) {
    // Get the drag source and drop target
    const { items } = this.document;
    const source = items.get(itemData._id);
    if (!source) return false;

    // @ts-expect-error
    const dropTarget = event.target!.closest("[data-item-id]");
    if (!dropTarget) return false;

    const target = items.get(dropTarget.dataset.itemId);

    // Don't sort on yourself
    if (source.id === target?.id) return false;

    // Identify sibling items based on adjacent HTML elements
    const siblings: any[] = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && (siblingId !== source.id)) {
        siblings.push(items.get(el.dataset.itemId));
      }
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(source, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const { update } = u;
      // @ts-expect-error
      update._id = u.target?._id;
      return update;
    });

    // Perform the update
    return this.document.updateEmbeddedDocuments("Item", updateData);
  }
}

type DragStartEvent = DragEvent & {
  currentTarget: EventTarget & HTMLLIElement;
};
type DropEvent = DragEvent & { currentTarget: EventTarget & HTMLElement };

declare namespace SvelteActorSheet {
  export interface Configuration<
    Document extends foundry.abstract.Document.Any =
      foundry.abstract.Document.Any,
  > extends foundry.applications.api.DocumentSheetV2.Configuration<Document> {}

  export interface RenderOptions
    extends foundry.applications.api.DocumentSheetV2.RenderOptions {}
}

export { SvelteActorSheet };
