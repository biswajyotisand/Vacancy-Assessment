import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ToastMsg } from "../types";

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "border-[#138808] text-[#138808]",
  error: "border-[#c62828] text-[#c62828]",
  info: "border-[#1565c0] text-[#1565c0]",
};

export function Toasts({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="no-print pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border-l-4 bg-white px-4 py-3 text-[13px] font-semibold text-slate-700 shadow-xl shadow-[#0a2540]/15 ${STYLES[t.type]}`}
            >
              <Icon size={17} strokeWidth={2.4} className="shrink-0" />
              <span className="text-slate-700">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
