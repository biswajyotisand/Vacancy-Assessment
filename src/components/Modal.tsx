import { motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}

export function Modal({
  title,
  subtitle,
  icon: Icon,
  accent = "#1565c0",
  onClose,
  wide,
  children,
}: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="no-print fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5"
    >
      <div
        className="absolute inset-0 bg-[#0a2540]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 26, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className={`relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30 ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: accent }}
          >
            <Icon size={17} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[15px] font-bold text-[#0a2540]">
              {title}
            </h2>
            {subtitle && (
              <p className="truncate text-[11px] text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>
        <div className="modal-scroll overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}
