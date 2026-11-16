import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "@firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "@firebase/firestore";
import { auth, db } from "./firebase";
import type { UserProfile } from "../types";

/**
 * Users log in with their HRMS ID, but the Firebase Auth account is created
 * against their REAL official email address — that is what makes Firebase's
 * built-in "password reset" and "email verification" mails deliverable.
 *
 * The HRMS ID → email mapping lives in the `hrmsIndex` collection so it can be
 * resolved *before* the user is authenticated (needed at login and at
 * password reset).
 */
export const hrmsKey = (hrmsId: string): string =>
  hrmsId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-");

/** Pseudo-email used by accounts created before real emails were collected. */
export const legacyHrmsEmail = (hrmsId: string): string =>
  `${hrmsKey(hrmsId)}@hrms.vacancy-calculation.app`;

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

/** b•••••n@railnet.gov.in — used in confirmation messages. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}•••@${domain}`;
  return `${user[0]}${"•".repeat(Math.min(user.length - 2, 6))}${
    user[user.length - 1]
  }@${domain}`;
}

/* ---------- registration coordination with the auth listener ---------- */

/**
 * While registration is running, the auth listener must not react to the
 * intermediate "signed-in but profile not written yet" state. When it ends we
 * fire this event so the listener re-evaluates the final state.
 */
export const AUTH_RECHECK_EVENT = "vacancy:auth-recheck";
let registrationInFlight = false;
export const isRegistering = (): boolean => registrationInFlight;

export interface RegisterInput {
  name: string;
  hrmsId: string;
  email: string;
  zone: string;
  division: string;
  office: string;
  password: string;
}

/** Converts Firebase error codes into friendly messages. */
export function friendlyAuthError(err: unknown): string {
  const code =
    (err as { code?: string })?.code ??
    (typeof (err as Error)?.message === "string" &&
    (err as Error).message.includes("permission")
      ? "permission-denied"
      : "");
  switch (code) {
    case "auth/configuration-not-found":
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "Email/Password sign-in is not enabled — enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/invalid-api-key":
      return "Invalid Firebase API key — check the firebase configuration.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect HRMS ID or password.";
    case "auth/user-not-found":
    case "app/hrms-not-found":
      return "No account found for this HRMS ID — please register first.";
    case "auth/email-already-in-use":
      return "This email address is already registered — please log in or use another email.";
    case "app/hrms-exists":
      return "This HRMS ID is already registered — please log in.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
    case "unavailable":
      return "Network error — check your internet connection.";
    case "auth/requires-recent-login":
    case "auth/user-token-expired":
    case "auth/user-disabled":
      return "Your session has ended. Please log in again.";
    case "permission-denied":
      return "Cloud database permission denied — verify your email address and make sure the Firestore rules are published.";
    default:
      return (err as Error)?.message || "Something went wrong. Please try again.";
  }
}

/** Resolves the sign-in email for an HRMS ID (null when not registered). */
export async function lookupEmailByHrms(
  hrmsId: string
): Promise<string | null> {
  const key = hrmsKey(hrmsId);
  if (!key) return null;
  try {
    const snap = await getDoc(doc(db, "hrmsIndex", key));
    if (!snap.exists()) return null;
    const email = (snap.data() as { email?: unknown }).email;
    return typeof email === "string" && email ? email : null;
  } catch {
    return null;
  }
}

async function registerUserInner(input: RegisterInput): Promise<void> {
  const key = hrmsKey(input.hrmsId);
  if (!key) throw new Error("Enter a valid HRMS ID.");
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    const e = new Error("Invalid email");
    (e as { code?: string }).code = "auth/invalid-email";
    throw e;
  }

  // Uniqueness pre-check on HRMS ID. If the index is unreadable (rules not yet
  // published) we continue — Firebase Auth still blocks duplicate emails.
  try {
    const existing = await getDoc(doc(db, "hrmsIndex", key));
    if (existing.exists()) {
      const e = new Error("HRMS ID already registered");
      (e as { code?: string }).code = "app/hrms-exists";
      throw e;
    }
  } catch (err) {
    if ((err as { code?: string })?.code === "app/hrms-exists") throw err;
  }

  // The auth account uses the REAL email so reset/verification mails arrive.
  const cred = await createUserWithEmailAndPassword(auth, email, input.password);
  try {
    await setDoc(doc(db, "users", cred.user.uid), {
      name: input.name.trim(),
      hrmsId: input.hrmsId.trim(),
      email,
      zone: input.zone,
      division: input.division.trim(),
      office: input.office.trim(),
      createdAt: serverTimestamp(),
    });
    // lookup entry: HRMS ID -> sign-in email
    await setDoc(doc(db, "hrmsIndex", key), { uid: cred.user.uid, email });
  } catch (err) {
    await signOut(auth);
    throw err;
  }

  // Ask the user to prove they own this mailbox. If sending fails the account
  // still exists — the verification screen offers a "Resend" button.
  try {
    await sendEmailVerification(cred.user);
  } catch {
    /* resend is available on the verification screen */
  }
}

export async function registerUser(input: RegisterInput): Promise<void> {
  registrationInFlight = true;
  try {
    await registerUserInner(input);
  } finally {
    registrationInFlight = false;
    window.dispatchEvent(new Event(AUTH_RECHECK_EVENT));
  }
}

export async function loginUser(
  hrmsId: string,
  password: string
): Promise<void> {
  // Resolve the real email for this HRMS ID; fall back to the legacy
  // pseudo-email for accounts created before emails were collected.
  const email = (await lookupEmailByHrms(hrmsId)) ?? legacyHrmsEmail(hrmsId);
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/** Re-sends Firebase's verification email to the signed-in user. */
export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    const e = new Error("Your session has ended. Please log in again.");
    (e as { code?: string }).code = "auth/user-token-expired";
    throw e;
  }
  await sendEmailVerification(user);
}

/**
 * Sends Firebase's password-reset email to the address registered against the
 * given HRMS ID. Returns the masked address for the confirmation message.
 */
export async function resetPasswordByHrms(hrmsId: string): Promise<string> {
  const email = await lookupEmailByHrms(hrmsId);
  if (!email) {
    const e = new Error("HRMS ID not found");
    (e as { code?: string }).code = "app/hrms-not-found";
    throw e;
  }
  await sendPasswordResetEmail(auth, email);
  return maskEmail(email);
}

export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data() as Record<string, unknown>;
  return {
    uid,
    name: String(d.name ?? ""),
    hrmsId: String(d.hrmsId ?? ""),
    email: String(d.email ?? ""),
    zone: String(d.zone ?? ""),
    division: String(d.division ?? ""),
    office: String(d.office ?? ""),
  };
}
