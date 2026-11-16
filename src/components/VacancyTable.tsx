import { motion } from "framer-motion";
import { ListTree, Lock, Minus, MoveDown, Plus } from "lucide-react";
import type {
  CatField,
  Category,
  CatValues,
  ComputedRow,
  Group,
  IntakeType,
} from "../types";
import {
  CATS,
  INTAKE_TYPES,
  fieldTotal,
  isDRQ,
  isExtraCat,
  sumCat,
} from "../lib/calc";

interface VacancyTableProps {
  computed: ComputedRow[];
  groups: Group[];
  onUpdatePost: (idx: number, value: string) => void;
  onUpdateIntake: (idx: number, value: IntakeType) => void;
  onUpdatePct: (idx: number, value: number) => void;
  onUpdateRemarks: (idx: number, value: string) => void;
  onUpdateCat: (idx: number, field: CatField, cat: Category, value: number) => void;
  onAddRowAfter: (idx: number) => void;
  onDeleteRow: (idx: number) => void;
  onMerge: (startIdx: number) => void;
  onUnmerge: (startIdx: number) => void;
}

/* ---------- category-wise editable input group (S/S, O/R, Anticipated) ---------- */

function CatGroup({
  rowIdx,
  row,
  field,
  onUpdateCat,
}: {
  rowIdx: number;
  row: ComputedRow;
  field: CatField;
  onUpdateCat: VacancyTableProps["onUpdateCat"];
}) {
  const applicable = isDRQ(row.intake);
  return (
    <td className="cat-cell">
      <div className="cat-group">
        {CATS.map((c) => {
          const disabled = isExtraCat(c) && !applicable;
          const val = disabled ? 0 : row[field][c] || 0;
          return (
            <div className="cat-item" key={c}>
              <label className={`cat-label cat-${c}`}>{c}</label>
              <input
                type="number"
                className="cat-input"
                value={val === 0 ? "" : val}
                placeholder="0"
                disabled={disabled}
                min={0}
                onChange={(e) =>
                  onUpdateCat(rowIdx, field, c, parseFloat(e.target.value) || 0)
                }
              />
              <span className="cat-print-value">{val}</span>
            </div>
          );
        })}
      </div>
      <div className="field-total-box">{fieldTotal(row, field)}</div>
    </td>
  );
}

/* ---------- read-only computed display (Existing / Chain / Total) ---------- */

function CatDisplay({ obj }: { obj: CatValues }) {
  return (
    <div className="cat-display">
      <span className="cat-total">{sumCat(obj)}</span>
      <span className="cat-sub">
        {CATS.map((c) => (
          <span key={c} className={`cat-chip cat-${c}`}>
            {c}&nbsp;{obj[c] || 0}
          </span>
        ))}
      </span>
    </div>
  );
}

/* ---------- main table ---------- */

export function VacancyTable({
  computed,
  groups,
  onUpdatePost,
  onUpdateIntake,
  onUpdatePct,
  onUpdateRemarks,
  onUpdateCat,
  onAddRowAfter,
  onDeleteRow,
  onMerge,
  onUnmerge,
}: VacancyTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.5, ease: "easeOut" }}
      className="card-shadow overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-[#0a2540]/10"
    >
      {/* legend / hint bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0a2540]/60">
          <ListTree size={13} strokeWidth={2.5} className="text-[#1565c0]" />
          Vacancy Worksheet
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="flex items-center gap-1">
            {CATS.map((c) => (
              <span key={c} className={`legend-chip lc-${c}`}>
                {c}
              </span>
            ))}
          </span>
          <span className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-500">
            <Lock size={11} strokeWidth={2.5} />
            OBC / EWS editable for DRQ rows only
          </span>
          <span className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-500">
            <MoveDown size={11} strokeWidth={2.5} />
            Chain vacancies cascade from the post above
          </span>
        </div>
      </div>

      <div className="table-scroll">
        <table className="vac-table">
          {/* proportional column widths — the table always fits the container */}
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "5.5%" }} />
            <col style={{ width: "3.5%" }} />
            <col style={{ width: "13.5%" }} />
            <col style={{ width: "13.5%" }} />
            <col style={{ width: "10.5%" }} />
            <col style={{ width: "13.5%" }} />
            <col style={{ width: "10.5%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "5%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Post</th>
              <th>Intake</th>
              <th>Intake&nbsp;%</th>
              <th>S/S</th>
              <th>O/R</th>
              <th>Existing Vac.</th>
              <th>Anticipated Vac.</th>
              <th>Chain Vac.</th>
              <th>Total Vac.</th>
              <th>Remarks</th>
              <th className="no-print">Action</th>
            </tr>
          </thead>

          {groups.map((g) => {
            const size = g.end - g.start + 1;
            return (
              <tbody key={g.start} className="group-body">
                {Array.from({ length: size }, (_, k) => {
                  const idx = g.start + k;
                  const row = computed[idx];
                  const drq = isDRQ(row.intake);
                  return (
                    <tr key={idx} className={drq ? "drq-row" : undefined}>
                      {idx === g.start && (
                        <td className="post-cell" rowSpan={size}>
                          <input
                            type="text"
                            className="post-input"
                            value={row.postName}
                            placeholder="Post name"
                            onChange={(e) => onUpdatePost(idx, e.target.value)}
                          />
                          <div className="merge-btn-group no-print">
                            <button
                              type="button"
                              className="merge-btn plus"
                              title="Merge with row below (add intake row)"
                              onClick={() => onMerge(idx)}
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                            {size > 1 && (
                              <button
                                type="button"
                                className="merge-btn minus"
                                title="Unmerge last row of this group"
                                onClick={() => onUnmerge(idx)}
                              >
                                <Minus size={12} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      <td className="intake-cell">
                        <select
                          className={`intake-select${drq ? " drq" : ""}`}
                          value={row.intake}
                          onChange={(e) =>
                            onUpdateIntake(idx, e.target.value as IntakeType)
                          }
                        >
                          {INTAKE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {drq && <span className="drq-tag no-print">DRQ</span>}
                      </td>

                      <td className="pct-cell">
                        <input
                          type="number"
                          className="intake-pct"
                          value={row.intakePercent === 0 ? "" : row.intakePercent}
                          placeholder="0"
                          step="0.01"
                          min={0}
                          onChange={(e) =>
                            onUpdatePct(idx, parseFloat(e.target.value) || 0)
                          }
                        />
                        <span className="pct-print-value">
                          {row.intakePercent || 0}
                        </span>
                      </td>

                      <CatGroup
                        rowIdx={idx}
                        row={row}
                        field="ss"
                        onUpdateCat={onUpdateCat}
                      />
                      <CatGroup
                        rowIdx={idx}
                        row={row}
                        field="or"
                        onUpdateCat={onUpdateCat}
                      />

                      <td className="cat-readonly">
                        <CatDisplay obj={row.existing} />
                      </td>

                      <CatGroup
                        rowIdx={idx}
                        row={row}
                        field="anticipated"
                        onUpdateCat={onUpdateCat}
                      />

                      <td className="cat-readonly chain-cell">
                        <CatDisplay obj={row.chain} />
                      </td>

                      <td className="cat-readonly total-col">
                        <CatDisplay obj={row.total} />
                      </td>

                      <td className="remarks-cell">
                        <input
                          type="text"
                          className="remarks-input"
                          value={row.remarks}
                          placeholder="—"
                          onChange={(e) => onUpdateRemarks(idx, e.target.value)}
                        />
                      </td>

                      <td className="action-cell no-print">
                        <button
                          type="button"
                          className="icon-btn add"
                          title="Add row below"
                          onClick={() => onAddRowAfter(idx)}
                        >
                          <Plus size={13} strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn del"
                          title="Delete row"
                          disabled={computed.length <= 1}
                          onClick={() => onDeleteRow(idx)}
                        >
                          <Minus size={13} strokeWidth={3} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </motion.div>
  );
}
