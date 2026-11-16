import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  AtSign,
  Building,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  LibraryBig,
  Loader2,
  LogIn,
  MailQuestion,
  MapPinned,
  SendHorizonal,
  ShieldCheck,
  TrainFront,
  User,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  friendlyAuthError,
  isValidEmail,
  loginUser,
  registerUser,
  resetPasswordByHrms,
} from "../lib/auth";
import { Chakra } from "./Chakra";

const ZONES = [
  "Central Railway",
  "East Central Railway",
  "East Coast Railway",
  "Eastern Railway",
  "Metro Railway (Kolkata)",
  "North Central Railway",
  "North Eastern Railway",
  "Northeast Frontier Railway",
  "North Western Railway",
  "Northern Railway",
  "South Central Railway",
  "South East Central Railway",
  "South Eastern Railway",
  "South Western Railway",
  "Southern Railway",
  "West Central Railway",
  "Western Railway",
  "Other / Railway Board / PU",
];

interface AuthScreenProps {
  initialError: string | null;
  onConsumedError: () => void;
}

type Mode = "login" | "register" | "reset";

const INPUT =
  "w-full rounded-lg border-[1.5px] border-[#d5dee8] bg-slate-50/70 px-3 py-2.5 pl-9 text-sm font-semibold text-[#0a2540] placeholder:font-normal placeholder:text-slate-400 focus:border-[#1565c0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1565c0]/10 transition-colors";
const SELECT =
  "w-full cursor-pointer appearance-none rounded-lg border-[1.5px] border-[#d5dee8] bg-slate-50/70 px-3 py-2.5 pl-9 text-sm font-semibold text-[#0a2540] focus:border-[#1565c0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1565c0]/10 transition-colors";
const LABEL =
  "mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0a2540]/60";

function FieldIcon({ icon: Icon }: { icon: typeof User }) {
  return (
    <Icon
      size={15}
      strokeWidth={2.3}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    />
  );
}

export function AuthScreen({ initialError, onConsumedError }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const [hrmsId, setHrmsId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState("");
  const [division, setDivision] = useState("");
  const [office, setOffice] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
    onConsumedError();
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    onConsumedError();
    try {
      await fn();
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  };

  const handleLogin = () => {
    if (!hrmsId.trim() || !password) {
      setError("Enter your HRMS ID and password.");
      return;
    }
    void run(() => loginUser(hrmsId, password));
  };

  const handleRegister = () => {
    if (
      !name.trim() ||
      !hrmsId.trim() ||
      !email.trim() ||
      !zone ||
      !division.trim() ||
      !office.trim()
    ) {
      setError("Please fill in all fields to register.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid official email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    void run(() =>
      registerUser({ name, hrmsId, email, zone, division, office, password })
    );
  };

  const handleReset = () => {
    if (!hrmsId.trim()) {
      setError("Enter your HRMS ID to receive a reset link.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    onConsumedError();
    resetPasswordByHrms(hrmsId)
      .then((masked) => {
        setSuccess(
          `Password reset link sent to ${masked}. Check your inbox (and spam folder), set a new password, then log in with your HRMS ID.`
        );
      })
      .catch((err) => setError(friendlyAuthError(err)))
      .finally(() => setBusy(false));
  };

  const shownError = error ?? initialError;

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

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] via-[#0d3357] to-[#123f66] text-white">
        <Chakra className="animate-spin-slower pointer-events-none absolute -right-24 -top-32 h-96 w-96 text-white/[0.07]" />
        <Chakra className="pointer-events-none absolute -bottom-44 -left-32 h-96 w-96 text-white/[0.05]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative mx-auto grid w-full gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-16 xl:px-10">
          {/* brand / pitch */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffb35c] backdrop-blur-sm">
                <TrainFront size={13} strokeWidth={2.4} />
                <span className="font-devanagari text-[13px] normal-case tracking-normal">
                  भारतीय रेल
                </span>
                <span className="text-white/40">•</span>
                Indian Railways
              </span>
              <h1 className="font-display mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Vacancy <span className="text-[#ff9933]">Assessment</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#cfe0f0]">
                Sign in with your HRMS ID to compute category-wise vacancies,
                build department cadres, and keep every assessment safely saved
                to your own account.
              </p>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-8 space-y-3.5"
            >
              {[
                {
                  icon: ShieldCheck,
                  title: "Private by default",
                  desc: "Every saved assessment is visible only to you after login.",
                },
                {
                  icon: LibraryBig,
                  title: "Shared cadre library",
                  desc: "Create department-wise cadres once — every railway user can apply them.",
                },
                {
                  icon: Zap,
                  title: "Instant computation",
                  desc: "Chain vacancies, DRQ splits and grand totals update as you type.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#ffb35c]">
                    <Icon size={15} strokeWidth={2.3} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-bold">{title}</p>
                    <p className="text-[12px] text-[#9fb8cf]">{desc}</p>
                  </div>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* auth card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="self-center"
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30">
              <div className="h-1 bg-gradient-to-r from-[#ff9933] via-white to-[#138808]" />
              <div className="p-6 sm:p-7">
                {mode === "reset" ? (
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#1565c0]">
                      <MailQuestion size={17} strokeWidth={2.4} />
                    </span>
                    <div>
                      <h2 className="font-display text-[15px] font-bold text-[#0a2540]">
                        Reset your password
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        We'll email a reset link to your registered address
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                    {(
                      [
                        { key: "login", label: "Log In", icon: LogIn },
                        { key: "register", label: "Register", icon: UserPlus },
                      ] as const
                    ).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => switchMode(key)}
                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-bold transition-all ${
                          mode === key
                            ? "bg-[#0d3357] text-white shadow-md"
                            : "text-slate-500 hover:text-[#0d3357]"
                        }`}
                      >
                        <Icon size={14} strokeWidth={2.5} />
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {shownError && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-[#c62828]">
                    <AlertTriangle
                      size={14}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0"
                    />
                    {shownError}
                  </div>
                )}
                {success && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] font-semibold text-emerald-700">
                    <CheckCircle2
                      size={14}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0"
                    />
                    {success}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (mode === "login") handleLogin();
                    else if (mode === "register") handleRegister();
                    else handleReset();
                  }}
                  className="space-y-3.5"
                >
                  {mode === "register" && (
                    <div>
                      <label className={LABEL}>Full Name</label>
                      <div className="relative">
                        <FieldIcon icon={User} />
                        <input
                          className={INPUT}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Biswajyoti Roy Sarkar"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={LABEL}>HRMS ID</label>
                    <div className="relative">
                      <FieldIcon icon={Landmark} />
                      <input
                        className={INPUT}
                        value={hrmsId}
                        onChange={(e) => setHrmsId(e.target.value)}
                        placeholder="Your HRMS ID"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {mode === "register" && (
                    <>
                      <div>
                        <label className={LABEL}>Official Email</label>
                        <div className="relative">
                          <FieldIcon icon={AtSign} />
                          <input
                            type="email"
                            className={INPUT}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. name@ir.gov.in"
                            autoComplete="email"
                          />
                        </div>
                        <p className="mt-1 pl-1 text-[10.5px] text-slate-400">
                          Used only to recover your password if you forget it.
                        </p>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div>
                          <label className={LABEL}>Railway Zone</label>
                          <div className="relative">
                            <FieldIcon icon={MapPinned} />
                            <select
                              className={SELECT}
                              value={zone}
                              onChange={(e) => setZone(e.target.value)}
                            >
                              <option value="">Select zone…</option>
                              {ZONES.map((z) => (
                                <option key={z} value={z}>
                                  {z}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={LABEL}>Railway Division</label>
                          <div className="relative">
                            <FieldIcon icon={Building2} />
                            <input
                              className={INPUT}
                              value={division}
                              onChange={(e) => setDivision(e.target.value)}
                              placeholder="e.g. Howrah"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className={LABEL}>Working Office</label>
                        <div className="relative">
                          <FieldIcon icon={Building} />
                          <input
                            className={INPUT}
                            value={office}
                            onChange={(e) => setOffice(e.target.value)}
                            placeholder="e.g. Divisional Office, Personnel Branch"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {mode !== "reset" && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className={LABEL}>Password</label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => switchMode("reset")}
                            className="mb-1 cursor-pointer text-[11px] font-bold text-[#1565c0] hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <FieldIcon icon={KeyRound} />
                        <input
                          type={showPw ? "text" : "password"}
                          className={`${INPUT} pr-10`}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={
                            mode === "register"
                              ? "Minimum 6 characters"
                              : "Your password"
                          }
                          autoComplete={
                            mode === "register"
                              ? "new-password"
                              : "current-password"
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === "register" && (
                    <div>
                      <label className={LABEL}>Confirm Password</label>
                      <div className="relative">
                        <FieldIcon icon={KeyRound} />
                        <input
                          type={showPw ? "text" : "password"}
                          className={INPUT}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          placeholder="Repeat the password"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e65100] to-[#ff9933] py-3 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#e65100]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : mode === "login" ? (
                      <LogIn size={16} strokeWidth={2.6} />
                    ) : mode === "register" ? (
                      <UserPlus size={16} strokeWidth={2.6} />
                    ) : (
                      <SendHorizonal size={16} strokeWidth={2.6} />
                    )}
                    {busy
                      ? "Please wait…"
                      : mode === "login"
                        ? "Log In with HRMS ID"
                        : mode === "register"
                          ? "Create Account"
                          : "Send Reset Link"}
                  </button>

                  {mode === "reset" && (
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-[12px] font-bold text-slate-500 transition hover:text-[#0d3357]"
                    >
                      <ArrowLeft size={13} strokeWidth={2.6} />
                      Back to log in
                    </button>
                  )}
                </form>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
                  {mode === "login"
                    ? "New here? Switch to Register and create your account first."
                    : mode === "register"
                      ? "Your HRMS ID becomes your login. Keep your password safe."
                      : "Enter the HRMS ID you registered with — the link goes to your official email."}
                </p>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-[#7d95ac]">
              © Indian Railways — Vacancy Assessment Tool · Created by
              Biswajyoti Roy Sarkar [DHQJPK]
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
