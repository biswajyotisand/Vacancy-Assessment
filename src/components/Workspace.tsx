import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BadgeCheck, PenLine } from "lucide-react";
import type {
  CadreTemplate,
  CatField,
  Category,
  IntakeType,
  Row,
  SavedAssessment,
  SheetInfo,
  ToastMsg,
  ToastType,
  UserProfile,
} from "../types";
import {
  bottomBreakup,
  computeAll,
  getGroups,
  grandTotals,
  mkRow,
  normalizeRow,
  sumCat,
} from "../lib/calc";
import {
  exportSheetHTML,
  parseImportedHTML,
  toSheetData,
} from "../lib/serialize";
import { buildSample } from "../lib/sample";
import { friendlyAuthError, logoutUser } from "../lib/auth";
import { makeTitle, saveAssessment } from "../lib/cloud";
import {
  clearDraft,
  loadDraft,
  purgeStaleDrafts,
  saveDraft,
} from "../lib/draft";
import { Tricolor } from "./Tricolor";
import { Header } from "./Header";
import { InfoBar } from "./InfoBar";
import { Toolbar } from "./Toolbar";
import { StatsStrip } from "./StatsStrip";
import { VacancyTable } from "./VacancyTable";
import { Toasts } from "./Toasts";
import { UserChip } from "./UserChip";
import { BreakupPanel } from "./BreakupPanel";
import { CadreLibrary } from "./CadreLibrary";
import { MyAssessments } from "./MyAssessments";

const EMPTY_INFO: SheetInfo = { department: "", cadre: "", period: "" };

interface WorkspaceProps {
  profile: UserProfile;
}

/**
 * The vacancy worksheet for ONE signed-in, email-verified user.
 * App renders it with key={uid}, so switching accounts always mounts a fresh
 * instance — in-memory sheet data can never leak from one user to the next.
 */
export function Workspace({ profile }: WorkspaceProps) {
  const uid = profile.uid;

  const [initial] = useState(() => loadDraft(uid));
  const [rows, setRows] = useState<Row[]>(initial?.rows ?? [mkRow()]);
  const [info, setInfo] = useState<SheetInfo>(initial?.info ?? EMPTY_INFO);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [cadreOpen, setCadreOpen] = useState(false);
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const toastId = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveBusy = useRef(false);
  const loggingOut = useRef(false);

  /* remove the old shared draft and any other account's leftover drafts */
  useEffect(() => {
    purgeStaleDrafts(uid);
  }, [uid]);

  /* auto-save the working draft — into THIS user's private slot only */
  useEffect(() => {
    if (loggingOut.current) return;
    saveDraft(uid, info, rows);
  }, [uid, info, rows]);

  const computed = useMemo(() => computeAll(rows), [rows]);
  const groups = useMemo(() => getGroups(rows), [rows]);
  const totals = useMemo(() => grandTotals(computed), [computed]);
  const breakup = useMemo(() => bottomBreakup(computed), [computed]);

  const pushToast = (message: string, type: ToastType = "success") => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((t) => [...t, { id, message, type }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3400
    );
  };

  /* ---------- field updates ---------- */

  const handleUpdatePost = (idx: number, value: string) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, postName: value } : r))
    );

  const handleUpdateIntake = (idx: number, value: IntakeType) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, intake: value } : r))
    );

  const handleUpdatePct = (idx: number, value: number) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, intakePercent: value } : r))
    );

  const handleUpdateRemarks = (idx: number, value: string) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, remarks: value } : r))
    );

  const handleUpdateCat = (
    idx: number,
    field: CatField,
    cat: Category,
    value: number
  ) =>
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r };
        next[field] = { ...r[field], [cat]: value };
        return next;
      })
    );

  /* ---------- row structure ---------- */

  const handleAddRowAfter = (idx: number) =>
    setRows((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, mkRow());
      return next;
    });

  const handleAddRowAtEnd = () => setRows((prev) => [...prev, mkRow()]);

  const handleDeleteRow = (idx: number) =>
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
    );

  const handleMerge = (startIdx: number) =>
    setRows((prev) => {
      const g = getGroups(prev).find((gr) => gr.start === startIdx);
      if (!g) return prev;
      const next = [...prev];
      const hasRowBelow = g.end < prev.length - 1;
      if (!hasRowBelow) {
        next.splice(g.end + 1, 0, mkRow({ postName: prev[g.start].postName }));
      }
      next[g.end] = { ...next[g.end], mergedWithNext: true };
      return next;
    });

  const handleUnmerge = (startIdx: number) =>
    setRows((prev) => {
      const g = getGroups(prev).find((gr) => gr.start === startIdx);
      if (!g || g.end <= g.start) return prev;
      return prev.map((r, i) =>
        i === g.end - 1 ? { ...r, mergedWithNext: false } : r
      );
    });

  /* ---------- toolbar & cloud actions ---------- */

  const handleSample = () => {
    const sample = buildSample();
    setInfo(sample.info);
    setRows(sample.rows);
    pushToast("Sample data loaded", "info");
  };

  const handleClear = () => {
    if (
      !window.confirm(
        "Clear the entire sheet? All rows and header details will be removed."
      )
    )
      return;
    setRows([mkRow()]);
    setInfo(EMPTY_INFO);
    pushToast("Sheet cleared", "info");
  };

  /** Save = private cloud save, visible only to this user. */
  const handleSave = async () => {
    if (saveBusy.current) return;
    saveBusy.current = true;
    try {
      await saveAssessment(uid, makeTitle(info), info, rows);
      pushToast("Saved to your account — visible only to you");
    } catch (err) {
      pushToast(friendlyAuthError(err), "error");
    } finally {
      saveBusy.current = false;
    }
  };

  /** Standalone HTML export (still available inside My Assessments). */
  const downloadHTML = () => {
    try {
      const data = toSheetData(rows, info);
      const html = exportSheetHTML(data);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const name = (info.department || "Sheet").trim().replace(/\s+/g, "-");
      a.download = `Vacancy-Assessment-${name}-${new Date()
        .toISOString()
        .slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast("HTML file downloaded");
    } catch {
      pushToast("Could not export the file", "error");
    }
  };

  const triggerImport = () => fileRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseImportedHTML(text);
      setRows(data.rows);
      setInfo(data.info);
      pushToast(
        `Imported ${data.rows.length} row${data.rows.length > 1 ? "s" : ""} from file`
      );
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Could not read this file",
        "error"
      );
    }
  };

  const handlePrint = () => window.print();

  const handleLoadAssessment = (item: SavedAssessment) => {
    setInfo(item.info);
    setRows(item.rows.map((r) => normalizeRow(r)));
    pushToast(`Loaded "${item.title}"`);
    setSheetsOpen(false);
  };

  /** Apply a shared cadre as the worksheet structure (modifiable afterwards). */
  const handleUseCadre = (tpl: CadreTemplate) => {
    const hasData =
      rows.length > 1 ||
      rows.some(
        (r) =>
          r.postName.trim() ||
          sumCat(r.ss) ||
          sumCat(r.or) ||
          sumCat(r.anticipated)
      );
    if (
      hasData &&
      !window.confirm(
        "This will replace the current worksheet with the cadre structure. Continue?"
      )
    )
      return;

    const newRows = tpl.rows.map((r) =>
      mkRow({
        postName: r.post,
        intake: r.intake,
        intakePercent: r.intakePercent,
      })
    );
    newRows.forEach((r, i) => {
      const n = newRows[i + 1];
      r.mergedWithNext =
        !!n &&
        r.postName.trim() !== "" &&
        n.postName.trim().toLowerCase() === r.postName.trim().toLowerCase();
    });
    if (newRows.length === 0) newRows.push(mkRow());
    setRows(newRows);
    setInfo((i) => ({ ...i, department: tpl.department, cadre: tpl.cadre }));
    pushToast(
      `Cadre applied: ${tpl.department} — ${tpl.cadre}. You can adjust anything now.`
    );
    setCadreOpen(false);
  };

  /**
   * Logout wipes this user's local draft so nothing stays behind on a shared
   * computer. If there is unsaved work the user is warned first.
   */
  const handleLogout = () => {
    const hasWork =
      rows.length > 1 ||
      rows.some(
        (r) =>
          r.postName.trim() ||
          r.remarks.trim() ||
          sumCat(r.ss) ||
          sumCat(r.or) ||
          sumCat(r.anticipated)
      ) ||
      Boolean(info.department.trim() || info.cadre.trim() || info.period.trim());

    if (
      hasWork &&
      !window.confirm(
        "Log out?\n\nYour current worksheet on this computer will be cleared. Click Cancel and use Save first if you want to keep it in your account."
      )
    )
      return;

    loggingOut.current = true;
    clearDraft(uid);
    void logoutUser();
  };

  /* ---------- render ---------- */

  return (
    <div className="app-shell min-h-screen pb-16 font-sans text-[#0d3357]">
      <Tricolor />
      <Header>
        <UserChip
          profile={profile}
          onOpenCadres={() => setCadreOpen(true)}
          onOpenSheets={() => setSheetsOpen(true)}
          onLogout={handleLogout}
        />
      </Header>

      <section className="relative z-10 mx-auto -mt-10 w-full px-3 sm:px-5">
        <InfoBar
          info={info}
          onChange={(patch) => setInfo((i) => ({ ...i, ...patch }))}
        />
      </section>

      <p className="credit-line no-print">
        <PenLine size={12} strokeWidth={2.5} className="text-[#e65100]" />
        Created by <span>Biswajyoti Roy Sarkar [DHQJPK]</span>
      </p>

      <main className="mx-auto mt-5 w-full space-y-5 px-3 sm:px-5">
        <StatsStrip totals={totals} />

        <Toolbar
          onSample={handleSample}
          onImport={triggerImport}
          onAddRow={handleAddRowAtEnd}
          onClear={handleClear}
          onSave={handleSave}
          onPrint={handlePrint}
        />

        <VacancyTable
          computed={computed}
          groups={groups}
          onUpdatePost={handleUpdatePost}
          onUpdateIntake={handleUpdateIntake}
          onUpdatePct={handleUpdatePct}
          onUpdateRemarks={handleUpdateRemarks}
          onUpdateCat={handleUpdateCat}
          onAddRowAfter={handleAddRowAfter}
          onDeleteRow={handleDeleteRow}
          onMerge={handleMerge}
          onUnmerge={handleUnmerge}
        />

        {breakup && <BreakupPanel data={breakup} />}

        <p className="footer-note no-print">
          <BadgeCheck size={13} strokeWidth={2.5} className="text-[#138808]" />
          © Indian Railways — Vacancy Assessment Tool · Save stores privately to
          your account · Cadres in the library are shared with all users.
        </p>
      </main>

      <input
        ref={fileRef}
        type="file"
        accept=".html,.htm"
        className="hidden"
        onChange={handleImportFile}
      />

      <AnimatePresence>
        {cadreOpen && (
          <CadreLibrary
            profile={profile}
            onClose={() => setCadreOpen(false)}
            onUse={handleUseCadre}
            notify={pushToast}
          />
        )}
        {sheetsOpen && (
          <MyAssessments
            profile={profile}
            onClose={() => setSheetsOpen(false)}
            onLoad={handleLoadAssessment}
            onExportCurrent={downloadHTML}
            notify={pushToast}
          />
        )}
      </AnimatePresence>

      <Toasts toasts={toasts} />
    </div>
  );
}
