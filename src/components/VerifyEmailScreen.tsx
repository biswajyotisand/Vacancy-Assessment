import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  LogOut,
  MailCheck,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  friendlyAuthError,
  maskEmail,
  resendVerificationEmail,
} from "../lib/auth";
import { Chakra } from "./Chakra";

interface VerifyEmailScreenProps {
  email: string | null;
  onRecheck: () => Promise<boolean>;
  onLogout: () => void;
}

type Notice = { kind: "ok" | "warn" | "err"; text: string };

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailScreen({
  email,
  onRecheck,
  onLogout,
}: VerifyEmailScreenProps) {
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [notice, setNotice] = useState<Notice | null>(null);
  const busy = useRef(false);

  const masked = email ? maskEmail(email) : "your registered email";

  /* resend countdown */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const check = async (manual: boolean) => {
    if (busy.current) return;
    busy.current = true;
    if (manual) {
      setChecking(true);
      setNotice(null);
    }
    try {
      const ok = await onRecheck();
      if (!ok && manual) {
        setNotice({
          kind: "warn",
          text: "Not verified yet. Open the link in the email we sent, then try again.",
        });
      }
    } catch (err) {
      if (manual) setNotice({ kind: "err", text: friendlyAuthError(err) });
    } finally {
      busy.current = false;
      if (manual) setChecking(false);
    }
  };

  /* detect verification automatically (polling + when the tab regains focus) */
  useEffect(() => {
    const id = window.setInterval(() => void check(false), 5000);
    const onFocus = () => void check(false);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resend = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setNotice(null);
    try {
      await resendVerificationEmail();
      setNotice({
        kind: "ok",
        text: `Verification email sent to ${masked}. Check your inbox and spam folder.`,
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setNotice({ kind: "err", text: friendlyAuthError(err) });
    } finally {
      setSending(false);
    }
  };

  const noticeStyle: Record<Notice["kind"], string> = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    err: "border-red-200 bg-red-50 text-[#c62828]",
  };
  const NoticeIcon = notice
    ? notice.kind === "ok"
      ? CheckCircle2
      : notice.kind === "warn"
        ? Info
        : AlertTriangle
    : Info;

  return (
    <div className="min-h-screen bg-[#0a2540]">
      <div className="relative z-50">
        <div className="flex h-2">
          <div className="flex-1 bg-gradient-to-r from-[#e8891f] via-[#ff9933] to-[#e8891f]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-gradient-to-r from-[#0f7a06] via-[#138808] to-[#0f7a06]" />
        </div>
        <Chakra className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-[#06038d]" />
      </div>

      <div className="relative flex min-h-[calc(100vh-8px)] items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a2540] via-[#0d3357] to-[#123f66] px-4 py-10">
        <Chakra className="animate-spin-slower pointer-events-none absolute -right-24 -top-32 h-96 w-96 text-white/[0.07]" />
        <Chakra className="pointer-events-none absolute -bottom-44 -left-32 h-96 w-96 text-white/[0.05]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30">
            <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0fb] text-[#1565c0]">
                  <MailCheck size={26} strokeWidth={2.2} />
                </span>
                <h1 className="font-display mt-4 text-xl font-extrabold text-[#0a2540]">
                  Verify your email address
                </h1>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  We sent a verification link to{" "}
                  <b className="text-[#0a2540]">{masked}</b>. Click the link in
                  that email, then come back here — this page continues
                  automatically.
                </p>
              </div>

              <ol className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-[12px] font-semibold text-slate-600">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d3357] text-[10px] font-extrabold text-white">
                    1
                  </span>
                  Open your inbox (also check Spam / Junk).
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d3357] text-[10px] font-extrabold text-white">
                    2
                  </span>
                  Click the verification link in the email.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d3357] text-[10px] font-extrabold text-white">
                    3
                  </span>
                  Return to this page and press the button below.
                </li>
              </ol>

              {notice && (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[12px] font-semibold ${noticeStyle[notice.kind]}`}
                >
                  <NoticeIcon
                    size={14}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0"
                  />
                  {notice.text}
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => void check(true)}
                  disabled={checking}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e65100] to-[#ff9933] py-3 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#e65100]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checking ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={15} strokeWidth={2.6} />
                  )}
                  {checking ? "Checking…" : "I've verified my email"}
                </button>

                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={cooldown > 0 || sending}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#d5dee8] bg-white py-2.5 text-[13px] font-bold text-[#0d3357] transition hover:border-[#1565c0] hover:text-[#1565c0] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-[#d5dee8] disabled:hover:text-[#0d3357]"
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} strokeWidth={2.5} />
                  )}
                  {cooldown > 0
                    ? `Resend email in ${cooldown}s`
                    : "Resend verification email"}
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 py-1.5 text-[12px] font-bold text-slate-500 transition hover:text-[#c62828]"
                >
                  <LogOut size={13} strokeWidth={2.6} />
                  Log out
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
                Typed the wrong email while registering? Please contact the
                administrator to correct your account.
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-[#7d95ac]">
            © Indian Railways — Vacancy Assessment Tool · Created by Biswajyoti
            Roy Sarkar [DHQJPK]
          </p>
        </motion.div>
      </div>
    </div>
  );
}
