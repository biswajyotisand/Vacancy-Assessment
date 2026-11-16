import { motion } from "framer-motion";
import { CheckCircle2, Layers3, type LucideIcon } from "lucide-react";
import type { BottomBreakup } from "../lib/calc";
import { CATS, sumCat, type CatValues } from "../lib/calc";

interface BreakupPanelProps {
  data: BottomBreakup;
}

const CAT_COLOR: Record<string, { fg: string; bg: string }> = {
  UR: { fg: "#1565c0", bg: "#e8f0fb" },
  SC: { fg: "#e65100", bg: "#fdeee2" },
  ST: { fg: "#138808", bg: "#e4f4e4" },
  OBC: { fg: "#6a1b9a", bg: "#f1e6f6" },
  EWS: { fg: "#00838f", bg: "#e0f2f4" },
};

function Chip({
  cat,
  value,
  muted = false,
}: {
  cat: string;
  value: number;
  muted?: boolean;
}) {
  const { fg, bg } = CAT_COLOR[cat] ?? { fg: "#334155", bg: "#e2e8f0" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold leading-tight"
      style={{
        color: muted ? "#94a3b8" : fg,
        background: muted ? "#f1f5f9" : bg,
      }}
    >
      {cat}
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function ChipRow({
  obj,
  total,
  muted = false,
}: {
  obj: CatValues;
  total: number;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {CATS.map((c) => (
        <Chip key={c} cat={c} value={obj[c] || 0} muted={muted} />
      ))}
      <span
        className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums"
        style={{ color: muted ? "#94a3b8" : "#0d3357", background: muted ? "#e2e8f0" : "#ffffff" }}
      >
        Σ {total}
      </span>
    </div>
  );
}

function ChannelCol({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: `${accent}33`, background: `${accent}0d` }}
    >
      <div
        className="mb-2 flex items-center justify-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider"
        style={{ color: accent }}
      >
        <Icon size={13} strokeWidth={2.5} />
        {title}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export function BreakupPanel({ data }: BreakupPanelProps) {
  const exPoolTotal = sumCat(data.existingPool);
  const anPoolTotal = sumCat(data.anticipatedPool);

  const exDistributedTotal = data.channels.reduce(
    (s, c) => s + sumCat(c.existing),
    0
  );
  const anDistributedTotal = data.channels.reduce(
    (s, c) => s + sumCat(c.anticipated),
    0
  );

  const reconciled =
    exDistributedTotal === exPoolTotal && anDistributedTotal === anPoolTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
      className="breakup-wrap card-shadow overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-[#0a2540]/10"
    >
      <div className="h-1 bg-gradient-to-r from-[#ff9933] via-[#ffc57d] to-[#ff9933]" />
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00838f]/10 text-[#00838f]">
              <Layers3 size={15} strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="font-display text-[14px] font-extrabold text-[#0a2540]">
                Percentage-wise Breakup of Higher Post Vacancies
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Distributed to <b className="text-[#0a2540]">{data.postName}</b>
                {" · "}DPQ & LDCE of higher posts only · nearest-integer
                allocation with balancing last channel
              </p>
            </div>
          </div>
          {reconciled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700">
              <CheckCircle2 size={12} strokeWidth={2.5} />
              Reconciled
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ChannelCol
            title="Existing Vacancy Share"
            icon={CheckCircle2}
            accent="#c62828"
          >
            {data.channels.map((c) => {
              const t = sumCat(c.existing);
              return (
                <div key={"ex-" + c.label}>
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                        c.intake === "DRQ"
                          ? "bg-[#fff3e0] text-[#e65100]"
                          : c.intake === "GDCE"
                            ? "bg-[#e0f2f4] text-[#00838f]"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.label}
                    </span>
                    <span className="text-[14px] font-extrabold tabular-nums text-[#0d3357]">
                      {t}
                    </span>
                  </div>
                  <ChipRow obj={c.existing} total={t} />
                </div>
              );
            })}
            <div className="mt-3 rounded-lg border border-slate-300 bg-white/80 px-3 py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Higher-post pool
                </span>
                <span className="text-[14px] font-extrabold tabular-nums text-[#c62828]">
                  {exPoolTotal}
                </span>
              </div>
              <div className="mt-1">
                <ChipRow obj={data.existingPool} total={exPoolTotal} muted />
              </div>
            </div>
          </ChannelCol>

          <ChannelCol
            title="Anticipated Vacancy Share"
            icon={CheckCircle2}
            accent="#6a1b9a"
          >
            {data.channels.map((c) => {
              const t = sumCat(c.anticipated);
              return (
                <div key={"an-" + c.label}>
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                        c.intake === "DRQ"
                          ? "bg-[#fff3e0] text-[#e65100]"
                          : c.intake === "GDCE"
                            ? "bg-[#e0f2f4] text-[#00838f]"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.label}
                    </span>
                    <span className="text-[14px] font-extrabold tabular-nums text-[#0d3357]">
                      {t}
                    </span>
                  </div>
                  <ChipRow obj={c.anticipated} total={t} />
                </div>
              );
            })}
            <div className="mt-3 rounded-lg border border-slate-300 bg-white/80 px-3 py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Higher-post pool
                </span>
                <span className="text-[14px] font-extrabold tabular-nums text-[#6a1b9a]">
                  {anPoolTotal}
                </span>
              </div>
              <div className="mt-1">
                <ChipRow obj={data.anticipatedPool} total={anPoolTotal} muted />
              </div>
            </div>
          </ChannelCol>
        </div>
      </div>
    </motion.div>
  );
}
