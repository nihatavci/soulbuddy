/**
 * lib/age.ts - the 18+ confirmation (App Review 1.2 and 5.1.1).
 *
 * The flag is set on the age-gate screen. Any path that can create an account without passing that
 * screen (Sign in with Apple from the sign-in screen, an account from an older build) must call
 * ensureAdult() before the profile is written, so no profile exists without a confirmation.
 */
import { Prefs } from '@/store/mmkv';

export const AGE_CONFIRMED_KEY = 'age_confirmed_18_plus';

export function isAgeConfirmed(): boolean {
  return Prefs.getBool(AGE_CONFIRMED_KEY);
}

/**
 * True when the person is confirmed 18+. If not yet confirmed, asks via `prompt` (resolves true on
 * "I am 18 or older") and stores the answer. A "no" stores nothing.
 */
export async function ensureAdult(prompt: () => Promise<boolean>): Promise<boolean> {
  if (isAgeConfirmed()) return true;
  if (!(await prompt())) return false;
  Prefs.setBool(AGE_CONFIRMED_KEY, true);
  return true;
}
