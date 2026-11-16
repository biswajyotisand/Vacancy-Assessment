import { logoutUser } from "./lib/auth";
import { useAuth } from "./lib/useAuth";
import { Tricolor } from "./components/Tricolor";
import { Chakra } from "./components/Chakra";
import { AuthScreen } from "./components/AuthScreen";
import { VerifyEmailScreen } from "./components/VerifyEmailScreen";
import { Workspace } from "./components/Workspace";

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0a2540]">
      <Tricolor />
      <div className="grow" />
      <Chakra className="h-14 w-14 animate-spin text-[#ff9933]" />
      <p className="text-sm font-semibold tracking-wider text-[#9fb8cf]">
        Loading your workspace…
      </p>
      <div className="grow" />
    </div>
  );
}

/**
 * Access gate:
 *   not signed in       → login / register
 *   signed in, unverified email → "verify your email" screen
 *   signed in + verified        → the worksheet (one isolated instance per user)
 */
export default function App() {
  const {
    status,
    profile,
    email,
    authError,
    clearAuthError,
    recheckVerification,
  } = useAuth();

  if (status === "loading") return <Splash />;

  if (status === "unverified") {
    return (
      <VerifyEmailScreen
        email={email}
        onRecheck={recheckVerification}
        onLogout={() => void logoutUser()}
      />
    );
  }

  if (status !== "in" || !profile) {
    return (
      <AuthScreen initialError={authError} onConsumedError={clearAuthError} />
    );
  }

  return <Workspace key={profile.uid} profile={profile} />;
}
