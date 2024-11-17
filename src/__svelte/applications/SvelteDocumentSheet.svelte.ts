import type {
  AnyObject,
  EmptyObject,
} from "@league-of-foundry-developers/foundry-vtt-types/src/types/utils.d.mts";

const { DocumentSheetV2 } = foundry.applications.api;

class SvelteDocumentSheet<
  D extends foundry.abstract.Document.Any,
  RenderContext extends AnyObject = EmptyObject,
  Configuration extends SvelteDocumentSheet.Configuration<D> =
    SvelteDocumentSheet.Configuration<D>,
  RenderOptions extends SvelteDocumentSheet.RenderOptions =
    SvelteDocumentSheet.RenderOptions,
> extends DocumentSheetV2<D, RenderContext, Configuration, RenderOptions> {
  #customHTMLTags = Object.values(foundry.applications.elements)
    .reduce((acc, E) => {
      const { tagName } = E;
      if (!tagName) return acc;
      acc.push(tagName.toUpperCase());
      return acc;
    }, [] as string[]);

  override _onChangeForm(
    formConfig: foundry.applications.api.ApplicationV2.FormConfiguration,
    event: Event | SubmitEvent,
  ) {
    super._onChangeForm(formConfig, event);

    if (event.type !== "change") return;
    if (!this.document) return;

    const { target } = event;
    if (!target) return;

    // @ts-expect-error
    if (!this.#customHTMLTags.includes(target.tagName)) return;

    // @ts-expect-error
    const value = target._getValue();

    // @ts-expect-error
    this.document.update({ [target.name]: value });
  }
}

declare namespace SvelteDocumentSheet {
  export interface Configuration<
    Document extends foundry.abstract.Document.Any =
      foundry.abstract.Document.Any,
  > extends foundry.applications.api.DocumentSheetV2.Configuration<Document> {}

  export interface RenderOptions
    extends foundry.applications.api.DocumentSheetV2.RenderOptions {}
}

export { SvelteDocumentSheet };
