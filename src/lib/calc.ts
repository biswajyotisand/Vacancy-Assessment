import type {
  CatField,
  Category,
  CatValues,
  ComputedRow,
  Group,
  IntakeType,
  Row,
} from "../types";

export type {
  CatField,
  Category,
  CatValues,
  ComputedRow,
  Group,
  IntakeType,
  Row,
} from "../types";

export const CATS: Category[] = ["UR", "SC", "ST", "OBC", "EWS"];
export const INTAKE_TYPES: IntakeType[] = ["DPQ", "LDCE", "GDCE", "DRQ"];

export const isExtraCat = (c: Category) => c === "OBC" || c === "EWS";
export const isDRQ = (intake: IntakeType) => intake === "DRQ";

export function emptyCat(): CatValues {
  return { UR: 0, SC: 0, ST: 0, OBC: 0, EWS: 0 };
}

type RowInput = Omit<Partial<Row>, "ss" | "or" | "anticipated"> & {
  ss?: Partial<CatValues>;
  or?: Partial<CatValues>;
  anticipated?: Partial<CatValues>;
};

export function mkRow(partial: RowInput = {}): Row {
  const base: Row = {
    postName: "",
    intake: "DPQ",
    intakePercent: 100,
    ss: emptyCat(),
    or: emptyCat(),
    anticipated: emptyCat(),
    remarks: "",
    mergedWithNext: false,
  };
  return {
    ...base,
    ...partial,
    ss: { ...emptyCat(), ...(partial.ss ?? {}) },
    or: { ...emptyCat(), ...(partial.or ?? {}) },
    anticipated: { ...emptyCat(), ...(partial.anticipated ?? {}) },
  };
}

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/** Safely rebuild a Row from untrusted data (import / localStorage). */
export function normalizeRow(raw: unknown): Row {
  const r = (raw ?? {}) as Record<string, unknown>;
  const normCat = (c: unknown): CatValues => {
    const out = emptyCat();
    const src = (c ?? {}) as Record<string, unknown>;
    CATS.forEach((k) => {
      out[k] = toNum(src[k]);
    });
    return out;
  };
  const intake = INTAKE_TYPES.includes(r.intake as IntakeType)
    ? (r.intake as IntakeType)
    : "DPQ";
  return mkRow({
    postName: typeof r.postName === "string" ? r.postName : "",
    intake,
    intakePercent:
      r.intakePercent === undefined || r.intakePercent === null
        ? 100
        : toNum(r.intakePercent),
    ss: normCat(r.ss),
    or: normCat(r.or),
    anticipated: normCat(r.anticipated),
    remarks: typeof r.remarks === "string" ? r.remarks : "",
    mergedWithNext: Boolean(r.mergedWithNext),
  });
}

/**
 * Rows are grouped by consecutive `mergedWithNext` flags — every row whose
 * flag is set belongs to the same group as the row below it.
 */
export function getGroups(rows: Row[]): Group[] {
  const groups: Group[] = [];
  let i = 0;
  while (i < rows.length) {
    const start = i;
    while (rows[i] && rows[i].mergedWithNext) i++;
    groups.push({ start, end: i });
    i++;
  }
  return groups;
}

/**
 * Core calculation:
 * - Chain Vacancy per row is split from the group above's non-DRQ Total,
 *   distributed by Intake % (rounded); the last row of each group receives
 *   the remainder (balancing figure).
 * - For DRQ rows only, that row's own UR Chain Vacancy is further split into
 *   UR / OBC / EWS using fixed percentages (OBC 27%, EWS 10%, remainder UR).
 *   This only re-labels the DRQ row's own chain figures — it does NOT change
 *   how much is drawn from the pool above, and DRQ rows remain fully excluded
 *   from the pool passed downward to the next group.
 * - Existing = S/S - O/R ; Total = Existing + Anticipated + Chain.
 * - OBC / EWS are only applicable to DRQ intake rows (forced 0 otherwise).
 */
export function computeAll(rows: Row[]): ComputedRow[] {
  const result: ComputedRow[] = rows.map((r) => ({
    ...r,
    ss: { ...r.ss },
    or: { ...r.or },
    anticipated: { ...r.anticipated },
    existing: emptyCat(),
    chain: emptyCat(),
    total: emptyCat(),
  }));

  const groups = getGroups(rows);
  let prevGroupTotal: CatValues | null = null;

  groups.forEach((g) => {
    const allocated = emptyCat();

    for (let idx = g.start; idx <= g.end; idx++) {
      const row = result[idx];
      if (prevGroupTotal) {
        const isLast = idx === g.end;
        if (!isLast) {
          CATS.forEach((c) => {
            const val = Math.round(
              (row.intakePercent / 100) * prevGroupTotal![c]
            );
            row.chain[c] = val;
            allocated[c] += val;
          });
        } else {
          CATS.forEach((c) => {
            row.chain[c] = prevGroupTotal![c] - allocated[c];
          });
        }

        // DRQ-only: split this row's own UR Chain Vacancy into UR/OBC/EWS
        if (isDRQ(row.intake)) {
          const urChain = row.chain.UR || 0;
          const obcPart = Math.round(0.27 * urChain);
          const ewsPart = Math.round(0.1 * urChain);
          row.chain.OBC = obcPart;
          row.chain.EWS = ewsPart;
          row.chain.UR = urChain - obcPart - ewsPart; // balancing figure stays UR
        }
      }
    }

    const groupTotalNonDRQ = emptyCat();
    for (let idx = g.start; idx <= g.end; idx++) {
      const row = result[idx];
      const applicable = isDRQ(row.intake);
      CATS.forEach((c) => {
        const isExtra = isExtraCat(c);
        const ss = isExtra && !applicable ? 0 : row.ss[c] || 0;
        const orv = isExtra && !applicable ? 0 : row.or[c] || 0;
        row.existing[c] = ss - orv;
        const ant = isExtra && !applicable ? 0 : row.anticipated[c] || 0;
        row.total[c] = row.existing[c] + ant + (row.chain[c] || 0);
        if (!applicable) {
          groupTotalNonDRQ[c] += row.total[c];
        }
      });
    }
    prevGroupTotal = groupTotalNonDRQ;
  });

  return result;
}

export function sumCat(obj: CatValues | null | undefined): number {
  if (!obj) return 0;
  return CATS.reduce((s, c) => s + (obj[c] || 0), 0);
}

/** Total of an editable field with non-applicable OBC/EWS masked off. */
export function fieldTotal(row: Row, field: CatField): number {
  const applicable = isDRQ(row.intake);
  return CATS.reduce(
    (s, c) =>
      isExtraCat(c) && !applicable ? s : s + (row[field][c] || 0),
    0
  );
}

export interface GrandTotals {
  ss: CatValues;
  or: CatValues;
  existing: CatValues;
  anticipated: CatValues;
  chain: CatValues;
  total: CatValues;
}

export function grandTotals(rows: ComputedRow[]): GrandTotals {
  const t: GrandTotals = {
    ss: emptyCat(),
    or: emptyCat(),
    existing: emptyCat(),
    anticipated: emptyCat(),
    chain: emptyCat(),
    total: emptyCat(),
  };
  rows.forEach((r) => {
    CATS.forEach((c) => {
      t.ss[c] += r.ss[c] || 0;
      t.or[c] += r.or[c] || 0;
      t.existing[c] += r.existing[c] || 0;
      t.anticipated[c] += r.anticipated[c] || 0;
      t.chain[c] += r.chain[c] || 0;
      t.total[c] += r.total[c] || 0;
    });
  });
  return t;
}

/* ========== percentage-wise breakup for the lower-most post ========== */

export type PoolName = "existing" | "anticipated";

export interface ChannelBreakdown {
  label: string;
  intake: IntakeType;
  /** Category-wise share (post-carve for DRQ). */
  existing: CatValues;
  anticipated: CatValues;
}

export interface BottomBreakup {
  /** Display name of the lower-most post (from the group's first row). */
  postName: string;
  /** One entry per channel (row) in the lower-most group. */
  channels: ChannelBreakdown[];
  /** Sum of DPQ+LDCE existing (only) from all rows above. */
  existingPool: CatValues;
  /** Sum of DPQ+LDCE anticipated (only) from all rows above. */
  anticipatedPool: CatValues;
}

function carveDRQ(ur: number): { UR: number; OBC: number; EWS: number } {
  const obc = Math.round(0.27 * ur);
  const ews = Math.round(0.1 * ur);
  const rem = ur - obc - ews;
  return { UR: rem, OBC: obc, EWS: ews };
}

/**
 * Distributes one pool across the given channels using nearest-integer rounding
 * for every channel except the last, which takes the balancing remainder. For
 * DRQ channels the UR portion is further carved into OBC 27% / EWS 10%.
 */
function distribute(
  pool: CatValues,
  channels: { intake: IntakeType; pct: number }[]
): CatValues[] {
  const out: CatValues[] = channels.map(() => emptyCat());
  if (channels.length === 0) return out;

  CATS.forEach((c) => {
    const total = pool[c] || 0;
    let allocated = 0;
    channels.forEach((ch, i) => {
      if (i < channels.length - 1) {
        const v = Math.round((ch.pct / 100) * total);
        out[i][c] = v;
        allocated += v;
      } else {
        out[i][c] = total - allocated;
      }
    });
  });

  // DRQ carve on UR (re-labels UR into UR/OBC/EWS; totals unchanged)
  channels.forEach((ch, i) => {
    if (isDRQ(ch.intake)) {
      const { UR, OBC, EWS } = carveDRQ(out[i].UR);
      out[i].UR = UR;
      out[i].OBC = OBC;
      out[i].EWS = EWS;
    }
  });

  return out;
}

/**
 * Builds the percentage-wise breakup panel for the lower-most post.
 * Returns null if there are no posts above the lower-most group (single-group
 * sheet) OR if the applicable pool (DPQ+LDCE rows above) sums to zero for both
 * Existing and Anticipated — the caller hides the panel in either case.
 */
export function bottomBreakup(computed: ComputedRow[]): BottomBreakup | null {
  if (computed.length === 0) return null;
  const groups = getGroups(computed);
  if (groups.length < 2) return null; // only one group — hide

  const bottomGroup = groups[groups.length - 1];
  const bottomRows = computed.slice(bottomGroup.start, bottomGroup.end + 1);
  const postName =
    bottomRows[0]?.postName?.trim() || `Post group ${groups.length}`;

  const existingPool = emptyCat();
  const anticipatedPool = emptyCat();
  const upperRows = computed.slice(0, bottomGroup.start);
  upperRows.forEach((r) => {
    if (r.intake === "DPQ" || r.intake === "LDCE") {
      CATS.forEach((c) => {
        existingPool[c] += r.existing[c] || 0;
        anticipatedPool[c] += r.anticipated[c] || 0;
      });
    }
  });

  const channelDefs = bottomRows.map((r) => ({
    label: `${r.intake} ${r.intakePercent || 0}%`,
    intake: r.intake,
    pct: r.intakePercent || 0,
  }));

  const existingShares = distribute(existingPool, channelDefs);
  const anticipatedShares = distribute(anticipatedPool, channelDefs);

  const channels: ChannelBreakdown[] = channelDefs.map((ch, i) => ({
    label: ch.label,
    intake: ch.intake,
    existing: existingShares[i],
    anticipated: anticipatedShares[i],
  }));

  return {
    postName,
    channels,
    existingPool,
    anticipatedPool,
  };
}
