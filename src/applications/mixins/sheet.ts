import type { AnyDocument, Constructor } from "../../types/utils.js";
import type DocumentSheetV2 from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/api/document-sheet.mjs";

export const HelpersMixin = <T extends Constructor<DocumentSheetV2<AnyDocument>>>(cls: T) => class extends cls {
  _dragDrop: DragDrop[];

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  constructor(...args: any[]) {
    const [options = {}] = args;

    super(options);

    this._dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    classes: ["ripcrypt"],
    actions: {
      editImage: this._onEditImage,
    },
    sheetConfig: false,
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
    },
    dragDrop: [{ dragSelector: '[data-uuid]', dropSelector: null }],
  };

  get dragDrop() {
    return this._dragDrop;
  }

  #createDragDropHandlers(): DragDrop[] {
    const { dragDrop } = this.options as { dragDrop: DragDropConfiguration[] };
    return dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  _canDragStart() {
    return this.isEditable;
  }


  _canDragDrop() {
    return this.isEditable;
  }


  async _onDragStart(event: DragEvent) {
    const el = event.currentTarget;
    if (!el || !(el instanceof HTMLElement)) { return; }
    // Extract the data you need
    let dragData = null;

    if (el.dataset.uuid) {
      const document = await fromUuid(el.dataset.uuid);
      if (!document) {
        return
      }

      // @ts-expect-error - Missing method
      dragData = document.toDragData();
    }


    if (!dragData) { return; }

    // Set data transfer
    event.dataTransfer?.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(_event: DragEvent) { }

  async _onDrop(_event: DragEvent) { }

  _onRender() {
    for (const d of this._dragDrop) {
      d.bind(this.element);
    }
  }

  static async _onEditImage(event: PointerEvent) {
    // @ts-expect-error - Stupid HTML typing
    const attr = event.target?.dataset.edit;
    // @ts-expect-error - document is not defined
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      current,
      type: "image",
      callback: path => {
        // @ts-expect-error - document is not defined
        // biome-ignore lint/complexity/noThisInStatic: <explanation>
        this.document.update({ img: path });
      },
      // @ts-expect-error - document is not defined
      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      top: this.position.top + 40,
      // @ts-expect-error - document is not defined
      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      left: this.position.left + 10
    });
    await fp.browse();
  }
};