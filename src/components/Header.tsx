import { motion } from "framer-motion";
import { TrainFront } from "lucide-react";
import type { ReactNode } from "react";
import { Chakra } from "./Chakra";

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="print-header relative overflow-hidden bg-[#0a2540] text-white">
      {/* gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2540] via-[#0d3357] to-[#1e5a8f]" />
      {/* decorative chakras */}
      <Chakra className="animate-spin-slower pointer-events-none absolute -right-20 -top-32 h-96 w-96 text-white/[0.08]" />
      <Chakra className="pointer-events-none absolute -bottom-40 -left-28 h-80 w-80 text-white/[0.05]" />
      {/* subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {children && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 mx-auto flex w-full justify-center px-3 pt-4 sm:justify-end sm:px-5"
        >
          {children}
        </motion.div>
      )}

      <div className="relative mx-auto w-full px-4 pb-20 pt-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-4 flex items-center justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffb35c] backdrop-blur-sm">
            <TrainFront size={13} strokeWidth={2.4} />
            <span className="font-devanagari normal-case tracking-normal text-[13px]">
              भारतीय रेल
            </span>
            <span className="text-white/40">•</span>
            Indian Railways
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
          className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl"
        >
          Vacancy <span className="text-[#ff9933]">Assessment</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" }}
          className="mt-2 text-sm text-[#cfe0f0]"
        >
          Vacancy Calculation Sheet — Establishment / Personnel Branch
        </motion.p>
      </div>
    </header>
  );
}
