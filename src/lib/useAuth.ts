import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "@firebase/auth";
import { auth } from "./firebase";
import {
  AUTH_RECHECK_EVENT,
  fetchProfile,
  friendlyAuthError,
  isRegistering,
} from "./auth";
import type { UserProfile } from "../types";

/**
 * loading     – Firebase has not reported the session yet
 * out         – nobody is signed in
 * unverified  – signed in, but the email address has not been verified yet
 * in          – signed in AND email verified (workspace is available)
 */
export type AuthStatus = "loading" | "out" | "unverified" | "in";

export interface AuthState {
  status: AuthStatus;
  profile: UserProfile | null;
  /** Email of the signed-in account (used on the verification screen). */
  email: string | null;
  authError: string | null;
  clearAuthError: () => void;
  /** Reloads the account; resolves true once the email is verified. */
  recheckVerification: () => Promise<boolean>;
}

interface Snapshot {
  status: AuthStatus;
  profile: UserProfile | null;
  email: string | null;
  authError: string | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<Snapshot>({
    status: "loading",
    profile: null,
    email: null,
    authError: null,
  });

  /** Guards against out-of-order async results. */
  const seq = useRef(0);
  /** Error to show on the login screen after a forced sign-out. */
  const pendingError = useRef<string | null>(null);

  const evaluate = useCallback(async (u: User | null) => {
    const mine = ++seq.current;
    const apply = (next: Snapshot) => {
      if (mine === seq.current) setState(next);
    };

    if (!u) {
      const authError = pendingError.current;
      pendingError.current = null;
      apply({ status: "out", profile: null, email: null, authError });
      return;
    }

    // Email must be verified before the workspace (and any cloud data) opens.
    if (!u.emailVerified) {
      apply({
        status: "unverified",
        profile: null,
        email: u.email,
        authError: null,
      });
      return;
    }

    try {
      const profile = await fetchProfile(u.uid);
      if (profile) {
        apply({
          status: "in",
          profile,
          email: u.email,
          authError: null,
        });
      } else {
        pendingError.current =
          "Your account profile could not be found. Please register again.";
        await signOut(auth);
      }
    } catch (err) {
      pendingError.current = friendlyAuthError(err);
      await signOut(auth);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      // During registration the final state is evaluated via the recheck event.
      if (isRegistering()) return;
      void evaluate(u);
    });
    const onRecheck = () => void evaluate(auth.currentUser);
    window.addEventListener(AUTH_RECHECK_EVENT, onRecheck);
    return () => {
      unsub();
      window.removeEventListener(AUTH_RECHECK_EVENT, onRecheck);
    };
  }, [evaluate]);

  const recheckVerification = useCallback(async (): Promise<boolean> => {
    const u = auth.currentUser;
    if (!u) return false;
    await u.reload();
    if (!u.emailVerified) return false;
    // Force a fresh ID token so Firestore rules see email_verified = true.
    await u.getIdToken(true);
    await evaluate(u);
    return true;
  }, [evaluate]);

  const clearAuthError = useCallback(
    () => setState((s) => ({ ...s, authError: null })),
    []
  );

  return { ...state, clearAuthError, recheckVerification };
}
