import { useEffect, useState } from "react";
import {
  ArrowUpFromLine,
  CalendarClock,
  Download,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { Modal } from "./Modal";
import type { SavedAssessment, ToastType, UserProfile } from "../types";
import { deleteAssessment, listMyAssessments } from "../lib/cloud";
import { friendlyAuthError } from "../lib/auth";

interface MyAssessmentsProps {
  profile: UserProfile;
  onClose: () => void;
  onLoad: (item: SavedAssessment) => void;
  onExportCurrent: () => void;
  notify: (message: string, type?: ToastType) => void;
}

export function MyAssessments({
  profile,
  onClose,
  onLoad,
  onExportCurrent,
  notify,
}: MyAssessmentsProps) {
  const [items, setItems] = useState<SavedAssessment[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setItems(null);
    try {
      setItems(await listMyAssessments(profile.uid));
    } catch (err) {
      setItems([]);
      notify(friendlyAuthError(err), "error");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (item: SavedAssessment) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`))
      return;
    setDeletingId(item.id);
    try {
      await deleteAssessment(item.id);
      setItems((prev) => (prev ?? []).filter((x) => x.id !== item.id));
      notify("Assessment deleted", "info");
    } catch (err) {
      notify(friendlyAuthError(err), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      title="My Assessments"
      subtitle="Only you can see the vacancy assessments you save"
      icon={History}
      accent="#00838f"
      wide
      onClose={onClose}
    >
      <div className="p-5">
        {items === null ? (
          <div className="flex items-center justify-center gap-2 py-14 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-semibold">
              Loading your saved assessments…
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <History size={30} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-500">
              Nothing saved yet.
            </p>
            <p className="max-w-xs text-xs text-slate-400">
              Click <b>Save</b> on the toolbar to store the current worksheet in
              your account — it stays private to you.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-[#00838f]/40 hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e0f2f4] text-[#00838f]">
                  <CalendarClock size={16} strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-[#0a2540]">
                    {item.title}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {item.savedAt > 0
                      ? new Date(item.savedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                    {" · "}
                    {item.rows.length} row{item.rows.length > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onLoad(item)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1565c0] px-3.5 py-2 text-[12px] font-bold text-white shadow transition hover:bg-[#1a74d4]"
                >
                  <ArrowUpFromLine size={13} strokeWidth={2.6} />
                  Load
                </button>
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                  title="Delete this assessment"
                  className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg bg-red-50 text-[#c62828] transition hover:bg-[#c62828] hover:text-white disabled:opacity-50"
                >
                  {deletingId === item.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} strokeWidth={2.4} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-slate-500">
            Need a portable copy? Export the current sheet as a standalone HTML
            file.
          </p>
          <button
            type="button"
            onClick={onExportCurrent}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#138808] bg-white px-3 py-1.5 text-[12px] font-bold text-[#138808] transition hover:bg-[#138808] hover:text-white"
          >
            <Download size={13} strokeWidth={2.6} />
            Export HTML
          </button>
        </div>
      </div>
    </Modal>
  );
}
