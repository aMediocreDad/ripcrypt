import type { AnyObject } from "../../types/utils.js";
import { HelpersMixin } from "../mixins/sheet.js";

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class GearSheet extends HelpersMixin(HandlebarsApplicationMixin(ItemSheetV2)) {
  static override PARTS = {
    form: {
      template: "systems/ripcrypt/templates/item.hbs"
    }
  }

  static override DEFAULT_OPTIONS = {
    position: {
      height: 400,
    }
  };

  // @ts-expect-error - Type mismatch
  override async _prepareContext() {
    return {
      enriched: {
        system: {
          notes: await TextEditor.enrichHTML(this.item.system.notes as string, { secrets: this.item.isOwner })
        }
      },
      item: this.item,
      system: this.item.system
    };
  }
}