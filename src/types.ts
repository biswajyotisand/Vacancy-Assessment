export type Category = "UR" | "SC" | "ST" | "OBC" | "EWS";

export type IntakeType = "DPQ" | "LDCE" | "GDCE" | "DRQ";

export type CatValues = Record<Category, number>;

/** Editable per-row fields holding category-wise numbers. */
export type CatField = "ss" | "or" | "anticipated";

export interface Row {
  postName: string;
  intake: IntakeType;
  intakePercent: number;
  /** Sanctioned Strength */
  ss: CatValues;
  /** On Roll */
  or: CatValues;
  /** Anticipated vacancies (editable) */
  anticipated: CatValues;
  remarks: string;
  /** When true, this row is visually merged (same Post cell) with the next row. */
  mergedWithNext: boolean;
}

export interface ComputedRow extends Row {
  /** existing = ss - or */
  existing: CatValues;
  /** chain vacancies drawn from the group above (non-DRQ total) */
  chain: CatValues;
  /** total = existing + anticipated + chain */
  total: CatValues;
}

export interface Group {
  start: number;
  end: number;
}

export interface SheetInfo {
  department: string;
  cadre: string;
  period: string;
}

export interface SheetData {
  version: number;
  savedAt: string;
  info: SheetInfo;
  rows: Row[];
}

export type ToastType = "success" | "error" | "info";

export interface ToastMsg {
  id: number;
  message: string;
  type: ToastType;
}

/* ---------- accounts & cloud ---------- */

export interface UserProfile {
  uid: string;
  name: string;
  hrmsId: string;
  /** Official email — used for password reset. */
  email: string;
  zone: string;
  division: string;
  office: string;
}

/** One row of a department-wise cadre template. */
export interface CadreRow {
  post: string;
  intake: IntakeType;
  intakePercent: number;
}

/** A shared cadre template, visible to every registered user. */
export interface CadreTemplate {
  id: string;
  department: string;
  cadre: string;
  rows: CadreRow[];
  createdBy: string;
  createdByName: string;
  createdAt: number;
}

/** A vacancy assessment saved to the cloud — private to its owner. */
export interface SavedAssessment {
  id: string;
  uid: string;
  title: string;
  info: SheetInfo;
  rows: Row[];
  savedAt: number;
}
