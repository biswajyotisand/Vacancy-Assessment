import type { Row, SheetInfo } from "../types";
import { normalizeRow } from "./calc";
import { STORAGE_KEY as LEGACY_SHARED_KEY } from "./serialize";

/**
 * Unsaved worksheet drafts are kept in this browser, one slot PER USER
 * (keyed by Firebase UID). One account can never load another account's draft,
 * even on a shared office computer.
 */
const PREFIX = "ir-vacancy-draft-v2:";

export const draftKey = (uid: string): string => `${PREFIX}${uid}`;

export interface Draft {
  rows: Row[];
  info: SheetInfo;
}

export function loadDraft(uid: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || parsed.rows.length === 0)
      return null;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    return {
      rows: parsed.rows.map((r: unknown) => normalizeRow(r)),
      info: {
        department: str(parsed.info?.department),
        cadre: str(parsed.info?.cadre),
        period: str(parsed.info?.period),
      },
    };
  } catch {
    return null;
  }
}

export function saveDraft(uid: string, info: SheetInfo, rows: Row[]): void {
  try {
    localStorage.setItem(draftKey(uid), JSON.stringify({ info, rows }));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function clearDraft(uid: string): void {
  try {
    localStorage.removeItem(draftKey(uid));
  } catch {
    /* ignore */
  }
}

/**
 * Removes drafts that do not belong to the user who just signed in:
 *  - the old single shared draft written by earlier versions of the app
 *  - drafts left behind by any other account on this computer
 */
export function purgeStaleDrafts(keepUid: string): void {
  try {
    const keep = draftKey(keepUid);
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k === LEGACY_SHARED_KEY || (k.startsWith(PREFIX) && k !== keep)) {
        doomed.push(k);
      }
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
