import { motion } from "framer-motion";
import { Building2, CalendarRange, Layers } from "lucide-react";
import type { SheetInfo } from "../types";

interface InfoBarProps {
  info: SheetInfo;
  onChange: (patch: Partial<SheetInfo>) => void;
}

const FIELDS = [
  {
    key: "department" as const,
    label: "Department",
    placeholder: "e.g. Personnel",
    icon: Building2,
    iconClass: "text-[#1565c0]",
  },
  {
    key: "cadre" as const,
    label: "Cadre",
    placeholder: "e.g. Ministerial",
    icon: Layers,
    iconClass: "text-[#6a1b9a]",
  },
  {
    key: "period" as const,
    label: "Assessment Period",
    placeholder: "e.g. 01.01.2026 to 01.01.2027",
    icon: CalendarRange,
    iconClass: "text-[#00838f]",
  },
];

export function InfoBar({ info, onChange }: InfoBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.22, ease: "easeOut" }}
      className="card-shadow overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-[#0a2540]/10"
    >
      <div className="h-1 bg-gradient-to-r from-[#ff9933] via-[#ffc57d] to-[#ff9933]" />
      <div className="grid gap-4 p-5 sm:grid-cols-3">
        {FIELDS.map(({ key, label, placeholder, icon: Icon, iconClass }) => (
          <div key={key}>
            <label
              htmlFor={`info-${key}`}
              className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0a2540]/70"
            >
              <Icon size={12} strokeWidth={2.5} className={iconClass} />
              {label}
            </label>
            <input
              id={`info-${key}`}
              type="text"
              value={info[key]}
              placeholder={placeholder}
              onChange={(e) => onChange({ [key]: e.target.value })}
              className="info-input w-full rounded-lg border-[1.5px] border-[#d5dee8] bg-slate-50/60 px-3 py-2 text-sm font-semibold text-[#0a2540] transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-[#1565c0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1565c0]/10"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
