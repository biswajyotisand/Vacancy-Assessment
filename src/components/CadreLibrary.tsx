import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Layers,
  LibraryBig,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Modal } from "./Modal";
import type {
  CadreRow,
  CadreTemplate,
  IntakeType,
  ToastType,
  UserProfile,
} from "../types";
import { INTAKE_TYPES } from "../lib/calc";
import { createCadre, deleteCadre, listCadres } from "../lib/cloud";
import { friendlyAuthError } from "../lib/auth";

interface CadreLibraryProps {
  profile: UserProfile;
  onClose: () => void;
  onUse: (tpl: CadreTemplate) => void;
  notify: (message: string, type?: ToastType) => void;
}

const MINI_INPUT =
  "w-full rounded-lg border-[1.5px] border-[#d5dee8] bg-slate-50/70 px-2.5 py-2 text-[13px] font-semibold text-[#0a2540] placeholder:font-normal placeholder:text-slate-400 focus:border-[#1565c0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1565c0]/10 transition-colors";

function emptyCadreRow(): CadreRow {
  return { post: "", intake: "DPQ", intakePercent: 100 };
}

/** Groups consecutive same-post rows, mirroring how the applied cadre merges. */
function cadrePreview(rows: CadreRow[]): { post: string; parts: string[] }[] {
  const groups: { post: string; parts: string[] }[] = [];
  rows.forEach((r) => {
    const last = groups[groups.length - 1];
    const same =
      last &&
      r.post.trim() !== "" &&
      last.post.trim().toLowerCase() === r.post.trim().toLowerCase();
    const label = `${r.intake} ${r.intakePercent || 0}%`;
    if (same) last.parts.push(label);
    else groups.push({ post: r.post || "(post name…)", parts: [label] });
  });
  return groups;
}

export function CadreLibrary({
  profile,
  onClose,
  onUse,
  notify,
}: CadreLibraryProps) {
  const [view, setView] = useState<"list" | "create">("list");
  const [cadres, setCadres] = useState<CadreTemplate[] | null>(null);
  const [search, setSearch] = useState("");

  const [department, setDepartment] = useState("");
  const [cadre, setCadre] = useState("");
  const [rows, setRows] = useState<CadreRow[]>([emptyCadreRow()]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setCadres(null);
    try {
      setCadres(await listCadres());
    } catch (err) {
      setCadres([]);
      notify(friendlyAuthError(err), "error");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!cadres) return [];
    const q = search.trim().toLowerCase();
    if (!q) return cadres;
    return cadres.filter(
      (c) =>
        c.department.toLowerCase().includes(q) ||
        c.cadre.toLowerCase().includes(q) ||
        c.rows.some((r) => r.post.toLowerCase().includes(q))
    );
  }, [cadres, search]);

  const patchRow = (i: number, patch: Partial<CadreRow>) =>
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    if (!department.trim() || !cadre.trim()) {
      notify("Enter both Department and Cadre names.", "error");
      return;
    }
    const cleaned = rows.filter((r) => r.post.trim() !== "");
    if (cleaned.length === 0) {
      notify("Add at least one post row.", "error");
      return;
    }
    setSaving(true);
    try {
      await createCadre(profile.uid, profile.name, {
        department: department.trim(),
        cadre: cadre.trim(),
        rows: cleaned.map((r) => ({
          post: r.post.trim(),
          intake: r.intake,
          intakePercent: r.intakePercent || 0,
        })),
      });
      notify(`Cadre "${department.trim()} — ${cadre.trim()}" published`);
      setDepartment("");
      setCadre("");
      setRows([emptyCadreRow()]);
      setView("list");
      void load();
    } catch (err) {
      notify(friendlyAuthError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tpl: CadreTemplate) => {
    if (
      !window.confirm(
        `Delete cadre "${tpl.department} — ${tpl.cadre}"? It will be removed for everyone.`
      )
    )
      return;
    try {
      await deleteCadre(tpl.id);
      notify("Cadre deleted", "info");
      void load();
    } catch (err) {
      notify(friendlyAuthError(err), "error");
    }
  };

  const preview = cadrePreview(rows);

  return (
    <Modal
      title="Cadre Library"
      subtitle="Department-wise cadres — created once, shared with every railway user"
      icon={LibraryBig}
      accent="#6a1b9a"
      wide
      onClose={onClose}
    >
      <div className="p-5">
        {/* top controls */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
              view === "list"
                ? "bg-[#6a1b9a] text-white shadow"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Browse Cadres
          </button>
          <button
            type="button"
            onClick={() => setView("create")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
              view === "create"
                ? "bg-[#6a1b9a] text-white shadow"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Plus size={13} strokeWidth={3} />
            Create Department Cadre
          </button>
          {view === "list" && (
            <div className="relative ml-auto">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search department, cadre or post…"
                className={`${MINI_INPUT} w-64 pl-8`}
              />
            </div>
          )}
        </div>

        {view === "list" ? (
          cadres === null ? (
            <div className="flex items-center justify-center gap-2 py-14 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-semibold">Loading cadres…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <LibraryBig size={30} className="text-slate-300" />
              <p className="text-sm font-bold text-slate-500">
                {search ? "No cadres match your search." : "No cadres created yet."}
              </p>
              <p className="text-xs text-slate-400">
                Create the first department-wise cadre — it will be visible to
                all users.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#6a1b9a]/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-extrabold text-[#0a2540]">
                        {tpl.department}
                      </p>
                      <p className="truncate text-[12px] font-semibold text-[#6a1b9a]">
                        {tpl.cadre}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#f1e6f6] px-2.5 py-0.5 text-[10px] font-bold text-[#6a1b9a]">
                      {tpl.rows.length} row{tpl.rows.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {cadrePreview(tpl.rows).map((g, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
                        title={g.parts.join(" + ")}
                      >
                        {g.post}
                        <span className="ml-1 font-semibold text-slate-400">
                          {g.parts.join(" + ")}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-400">
                    <User size={11} strokeWidth={2.5} />
                    {tpl.createdByName || "Unknown"}
                    {tpl.createdAt > 0 && (
                      <span>
                        ·{" "}
                        {new Date(tpl.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUse(tpl)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#1565c0] py-2 text-[12px] font-bold text-white shadow transition hover:bg-[#1a74d4]"
                    >
                      <ArrowDownToLine size={13} strokeWidth={2.6} />
                      Use for Assessment
                    </button>
                    {tpl.createdBy === profile.uid && (
                      <button
                        type="button"
                        onClick={() => handleDelete(tpl)}
                        title="Delete this cadre"
                        className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg bg-red-50 text-[#c62828] transition hover:bg-[#c62828] hover:text-white"
                      >
                        <Trash2 size={14} strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ---------- create form ---------- */
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0a2540]/60">
                  <Layers size={11} strokeWidth={2.5} className="text-[#1565c0]" />
                  Department
                </label>
                <input
                  className={MINI_INPUT}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Personnel"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0a2540]/60">
                  <LibraryBig
                    size={11}
                    strokeWidth={2.5}
                    className="text-[#6a1b9a]"
                  />
                  Cadre
                </label>
                <input
                  className={MINI_INPUT}
                  value={cadre}
                  onChange={(e) => setCadre(e.target.value)}
                  placeholder="e.g. Ministerial"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 grid grid-cols-[1fr_104px_84px_30px] items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Post</span>
                <span>Intake</span>
                <span>Intake %</span>
                <span />
              </div>
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_104px_84px_30px] items-center gap-2"
                  >
                    <input
                      className={MINI_INPUT}
                      value={r.post}
                      onChange={(e) => patchRow(i, { post: e.target.value })}
                      placeholder="Post name"
                    />
                    <select
                      className={`${MINI_INPUT} cursor-pointer appearance-none`}
                      value={r.intake}
                      onChange={(e) =>
                        patchRow(i, { intake: e.target.value as IntakeType })
                      }
                    >
                      {INTAKE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className={MINI_INPUT}
                      value={r.intakePercent || ""}
                      placeholder="100"
                      step="0.01"
                      min={0}
                      onChange={(e) =>
                        patchRow(i, {
                          intakePercent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <button
                      type="button"
                      title="Remove row"
                      disabled={rows.length <= 1}
                      onClick={() =>
                        setRows((prev) => prev.filter((_, k) => k !== i))
                      }
                      className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg bg-red-50 text-[#c62828] transition hover:bg-[#c62828] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-red-50 disabled:hover:text-[#c62828]"
                    >
                      <Minus size={14} strokeWidth={2.6} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, emptyCadreRow()])}
                className="mt-2.5 flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-500 transition hover:border-[#1565c0] hover:text-[#1565c0]"
              >
                <Plus size={13} strokeWidth={3} />
                Add post / intake row
              </button>
            </div>

            {/* merge preview */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Preview — consecutive rows with the same post merge in the sheet
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.map((g, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-[#0a2540] shadow-sm"
                  >
                    {g.post}
                    <span className="ml-1.5 font-semibold text-[#6a1b9a]">
                      {g.parts.join(" + ")}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6a1b9a] to-[#8e24aa] py-3 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#6a1b9a]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LibraryBig size={15} strokeWidth={2.5} />
              )}
              {saving ? "Publishing…" : "Publish Cadre for Everyone"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
