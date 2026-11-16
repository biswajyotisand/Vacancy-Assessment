import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "@firebase/firestore";
import { db } from "./firebase";
import type {
  CadreRow,
  CadreTemplate,
  IntakeType,
  Row,
  SavedAssessment,
  SheetInfo,
} from "../types";
import { INTAKE_TYPES, normalizeRow } from "./calc";

/* ================= vacancy assessments (private per user) ================= */

export function makeTitle(info: SheetInfo): string {
  return [
    info.department || "Untitled",
    info.cadre || "—",
    info.period || new Date().toLocaleDateString("en-IN"),
  ].join(" · ");
}

export async function saveAssessment(
  uid: string,
  title: string,
  info: SheetInfo,
  rows: Row[]
): Promise<void> {
  await addDoc(collection(db, "assessments"), {
    uid,
    title,
    info: { ...info },
    rows: rows.map((r) => normalizeRow(r)),
    savedAt: serverTimestamp(),
  });
}

export async function listMyAssessments(
  uid: string
): Promise<SavedAssessment[]> {
  const q = query(collection(db, "assessments"), where("uid", "==", uid));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const info = (data.info ?? {}) as Record<string, unknown>;
    return {
      id: d.id,
      uid: String(data.uid ?? ""),
      title: String(data.title ?? "Assessment"),
      info: {
        department: String(info.department ?? ""),
        cadre: String(info.cadre ?? ""),
        period: String(info.period ?? ""),
      },
      rows: Array.isArray(data.rows)
        ? data.rows.map((r) => normalizeRow(r))
        : [],
      savedAt:
        (data.savedAt as { toMillis?: () => number } | null)?.toMillis?.() ?? 0,
    } as SavedAssessment;
  });
  // client-side sort avoids needing a composite Firestore index
  return items.sort((a, b) => b.savedAt - a.savedAt);
}

export async function deleteAssessment(id: string): Promise<void> {
  await deleteDoc(doc(db, "assessments", id));
}

/* ================= department-wise cadres (shared with all users) ================= */

export async function createCadre(
  uid: string,
  displayName: string,
  payload: { department: string; cadre: string; rows: CadreRow[] }
): Promise<void> {
  await addDoc(collection(db, "cadres"), {
    ...payload,
    createdBy: uid,
    createdByName: displayName,
    createdAt: serverTimestamp(),
  });
}

export async function listCadres(): Promise<CadreTemplate[]> {
  const snap = await getDocs(collection(db, "cadres"));
  const items = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const rawRows = Array.isArray(data.rows) ? data.rows : [];
    const rows: CadreRow[] = rawRows.map((r) => {
      const rr = (r ?? {}) as Record<string, unknown>;
      return {
        post: String(rr.post ?? ""),
        intake: INTAKE_TYPES.includes(rr.intake as IntakeType)
          ? (rr.intake as IntakeType)
          : "DPQ",
        intakePercent:
          typeof rr.intakePercent === "number" && isFinite(rr.intakePercent)
            ? rr.intakePercent
            : 100,
      };
    });
    return {
      id: d.id,
      department: String(data.department ?? ""),
      cadre: String(data.cadre ?? ""),
      rows,
      createdBy: String(data.createdBy ?? ""),
      createdByName: String(data.createdByName ?? ""),
      createdAt:
        (data.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ??
        0,
    } as CadreTemplate;
  });
  return items.sort(
    (a, b) =>
      a.department.localeCompare(b.department) || b.createdAt - a.createdAt
  );
}

export async function deleteCadre(id: string): Promise<void> {
  await deleteDoc(doc(db, "cadres", id));
}
