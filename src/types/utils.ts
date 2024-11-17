import type { AnyDocument } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/data/abstract/client-document.mjs";
import type { AnyObject } from "@league-of-foundry-developers/foundry-vtt-types/src/types/utils.d.mts";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type Constructor<T = {}> = new (...a: any[]) => T;

export type {
  AnyDocument,
  AnyObject
}