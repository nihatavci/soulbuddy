/**
 * __tests__/i18n-key-parity.test.ts
 *
 * FEAT-4: recursive key-parity test between i18n/en.json and i18n/de.json.
 *
 * Every nested key path present in en.json must exist in de.json, and vice
 * versa — no missing keys, no extras on either side. This is a pure data
 * comparison against the real translation resource files (no mocking).
 *
 * Deliberately placed in its own file (not __tests__/i18n.test.ts) to avoid
 * file contention with the concurrent FEAT-3 rewrite of that file.
 */

import de from '@/i18n/de.json';
import en from '@/i18n/en.json';

// Assumption (per roadmap FEAT-4 note): no namespace currently uses a JSON
// array as a value — every value is either a nested object or a string
// leaf. A "leaf" is therefore anything that is not a plain (non-array)
// object. If a future namespace introduces an array, this helper treats it
// as a leaf (compared by path presence only, not by its contents).
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
interface JsonObject {
  [key: string]: JsonValue;
}

function isPlainObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function flattenKeys(obj: JsonObject, prefix = ''): Set<string> {
  const paths = new Set<string>();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      for (const nested of flattenKeys(value, path)) {
        paths.add(nested);
      }
    } else {
      paths.add(path);
    }
  }
  return paths;
}

describe('FEAT-4: recursive key-parity between en.json and de.json', () => {
  const enKeys = flattenKeys(en as unknown as JsonObject);
  const deKeys = flattenKeys(de as unknown as JsonObject);

  it('has no keys present in en.json but missing from de.json', () => {
    const missingFromDe = [...enKeys].filter((path) => !deKeys.has(path));
    if (missingFromDe.length > 0) {
      throw new Error(
        `Keys present in en.json but missing from de.json:\n${missingFromDe.join('\n')}`
      );
    }
  });

  it('has no extra keys present in de.json but absent from en.json', () => {
    const extraInDe = [...deKeys].filter((path) => !enKeys.has(path));
    if (extraInDe.length > 0) {
      throw new Error(
        `Keys present in de.json but missing from en.json (extras):\n${extraInDe.join('\n')}`
      );
    }
  });

  it('has an identical, non-empty recursive key set on both sides', () => {
    expect(enKeys.size).toBeGreaterThan(0);
    expect(deKeys.size).toBe(enKeys.size);
    expect([...enKeys].sort()).toEqual([...deKeys].sort());
  });
});
