import { motion } from "framer-motion";
import {
  CalendarClock,
  ClipboardList,
  Link2,
  Sigma,
  TrendingDown,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CatValues } from "../types";
import { CATS, sumCat, type GrandTotals } from "../lib/calc";

interface StatsStripProps {
  totals: GrandTotals;
}

interface CardDef {
  key: keyof GrandTotals;
  label: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
}

const CARDS: CardDef[] = [
  {
    key: "ss",
    label: "Sanctioned Strength",
    icon: ClipboardList,
    accent: "#1565c0",
    soft: "#e8f0fb",
  },
  {
    key: "or",
    label: "On Roll",
    icon: Users,
    accent: "#5b21b6",
    soft: "#efe9fb",
  },
  {
    key: "existing",
    label: "Existing Vac.",
    icon: TrendingDown,
    accent: "#c62828",
    soft: "#fdecec",
  },
  {
    key: "anticipated",
    label: "Anticipated Vac.",
    icon: CalendarClock,
    accent: "#6a1b9a",
    soft: "#f3e9f7",
  },
  {
    key: "chain",
    label: "Chain Vac.",
    icon: Link2,
    accent: "#00838f",
    soft: "#e3f2f4",
  },
];

const CAT_TEXT: Record<string, string> = {
  UR: "#1565c0",
  SC: "#e65100",
  ST: "#138808",
  OBC: "#6a1b9a",
  EWS: "#00838f",
};

function MiniBreakdown({ obj, light }: { obj: CatValues; light?: boolean }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5">
      {CATS.map((c) => (
        <span
          key={c}
          className="text-[9px] font-bold"
          style={{ color: light ? "rgba(255,255,255,.75)" : CAT_TEXT[c] }}
        >
          {c} {obj[c] || 0}
        </span>
      ))}
    </div>
  );
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`inline-block font-display text-[26px] font-extrabold leading-none ${className ?? ""}`}
    >
      {value}
    </motion.span>
  );
}

export function StatsStrip({ totals }: StatsStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.32, ease: "easeOut" }}
      className="no-print grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
    >
      {CARDS.map(({ key, label, icon: Icon, accent, soft }) => (
        <div
          key={key}
          className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-[#0a2540]/5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
              {label}
            </span>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: soft, color: accent }}
            >
              <Icon size={13} strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-1.5" style={{ color: accent }}>
            <AnimatedNumber value={sumCat(totals[key])} />
          </div>
          <MiniBreakdown obj={totals[key]} />
        </div>
      ))}

      {/* Grand total — highlighted */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a2540] to-[#123f66] p-3.5 shadow-md shadow-[#0a2540]/30">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff9933] via-white/80 to-[#138808]" />
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-white/70">
            Total Vacancy
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ff9933]/20 text-[#ff9933]">
            <Sigma size={13} strokeWidth={2.5} />
          </span>
        </div>
        <div className="mt-1.5 text-[#ff9933]">
          <AnimatedNumber value={sumCat(totals.total)} />
        </div>
        <MiniBreakdown obj={totals.total} light />
      </div>
    </motion.div>
  );
}
