/**
 * __tests__/consent-and-age.test.ts
 *
 * App Review 5.1.1/5.1.2 and 1.2: nothing is tracked before the user agrees, and no profile exists
 * without an 18+ confirmation.
 */
const mockStore = new Map<string, boolean>();
jest.mock('../store/mmkv', () => ({
  Prefs: {
    getBool: (k: string) => mockStore.get(k) ?? false,
    setBool: (k: string, v: boolean) => { mockStore.set(k, v); },
  },
}));

import {
  acceptAllConsent,
  analyticsAllowed,
  crashReportsAllowed,
  onConsentChange,
  rejectNonEssentialConsent,
  saveConsentPreferences,
} from '../lib/consent';
import { AGE_CONFIRMED_KEY, ensureAdult, isAgeConfirmed } from '../lib/age';

beforeEach(() => mockStore.clear());

describe('consent gates analytics and crash reports', () => {
  it('allows nothing before the user has chosen', () => {
    expect(analyticsAllowed()).toBe(false);
    expect(crashReportsAllowed()).toBe(false);
  });

  it('follows exactly what was saved', () => {
    saveConsentPreferences({ analytics: true, crashReport: false, aiProcessing: false });
    expect(analyticsAllowed()).toBe(true);
    expect(crashReportsAllowed()).toBe(false);
  });

  it('reject turns both off again', () => {
    acceptAllConsent();
    rejectNonEssentialConsent();
    expect(analyticsAllowed()).toBe(false);
    expect(crashReportsAllowed()).toBe(false);
  });

  it('accept all does not grant AI consent (no AI feature exists)', () => {
    acceptAllConsent();
    expect(analyticsAllowed()).toBe(true);
    expect(mockStore.get('gdpr_consent_ai_processing')).toBe(false);
  });

  it('tells subscribers when consent is saved, until they unsubscribe', () => {
    const seen: boolean[] = [];
    const off = onConsentChange((p) => seen.push(p.analytics));
    saveConsentPreferences({ analytics: true, crashReport: false, aiProcessing: false });
    off();
    saveConsentPreferences({ analytics: false, crashReport: false, aiProcessing: false });
    expect(seen).toEqual([true]);
  });
});

describe('ensureAdult', () => {
  it('does not ask again once confirmed', async () => {
    mockStore.set(AGE_CONFIRMED_KEY, true);
    const prompt = jest.fn().mockResolvedValue(false);
    expect(await ensureAdult(prompt)).toBe(true);
    expect(prompt).not.toHaveBeenCalled();
  });

  it('stores nothing when the answer is no', async () => {
    expect(await ensureAdult(async () => false)).toBe(false);
    expect(isAgeConfirmed()).toBe(false);
  });

  it('stores the confirmation when the answer is yes', async () => {
    expect(await ensureAdult(async () => true)).toBe(true);
    expect(isAgeConfirmed()).toBe(true);
  });
});
