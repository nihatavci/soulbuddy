/**
 * __tests__/translations.test.ts
 *
 * L10N-06: en.json must be valid JSON and contain the minimum required keys.
 * (ro/tr parity tests removed — app is English-only.)
 */

import en from '@/i18n/en.json';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

function getByPath(obj: JsonObject, path: string): JsonValue | undefined {
  return path.split('.').reduce<JsonValue | undefined>((acc, key) => {
    if (acc !== null && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as JsonObject)[key];
    }
    return undefined;
  }, obj);
}

describe('L10N-06: English translation sanity', () => {
  const requiredKeys = [
    'tabs.home',
    'errors.somethingWrong',
    'auth.signIn.title',
    'auth.signUp.title',
    'profile.title',
    'account.title',
    'consent.privacyTitle',
    'paywall.subscribe',
    'subscription.cancelled.heading',
    'subscription.success.heading',
  ];

  it('en.json contains all required keys', () => {
    const missingKeys: string[] = [];
    for (const key of requiredKeys) {
      const val = getByPath(en as unknown as JsonObject, key);
      if (val === undefined) {
        missingKeys.push(key);
      }
    }
    if (missingKeys.length > 0) {
      fail(`en.json is missing keys: ${missingKeys.join(', ')}`);
    }
  });

  it('en.json has no empty string values for required keys', () => {
    const emptyKeys: string[] = [];
    for (const key of requiredKeys) {
      const val = getByPath(en as unknown as JsonObject, key);
      if (val === '') {
        emptyKeys.push(key);
      }
    }
    if (emptyKeys.length > 0) {
      fail(`en.json has empty values for: ${emptyKeys.join(', ')}`);
    }
  });
});
