/**
 * lib/localMessageHide.test.ts
 *
 * "Delete for me" — a message hidden only on this device, never touching the
 * server. Persisted per-space in Prefs (MMKV/in-memory fallback), so it
 * survives an app restart and never leaks into another space's hidden set.
 */

jest.mock('@/store/mmkv', () => {
  const mem = new Map<string, string>();
  return {
    Prefs: {
      get: jest.fn((key: string, fallback?: string) => mem.get(key) ?? fallback),
      set: jest.fn((key: string, value: string) => mem.set(key, value)),
      remove: jest.fn((key: string) => mem.delete(key)),
    },
  };
});

import { hideMessageForMe, isHiddenForMe, getHiddenIds } from '@/lib/localMessageHide';

describe('localMessageHide', () => {
  it('a message is not hidden until hideMessageForMe is called', () => {
    expect(isHiddenForMe('space_1', 'msg_1')).toBe(false);
  });

  it('hiding a message makes isHiddenForMe true for that space+id only', () => {
    hideMessageForMe('space_1', 'msg_1');
    expect(isHiddenForMe('space_1', 'msg_1')).toBe(true);
    // different id, same space — not hidden
    expect(isHiddenForMe('space_1', 'msg_2')).toBe(false);
    // same id, different space — not hidden (no cross-space leakage)
    expect(isHiddenForMe('space_2', 'msg_1')).toBe(false);
  });

  it('getHiddenIds returns the full hidden set for a space', () => {
    hideMessageForMe('space_3', 'a');
    hideMessageForMe('space_3', 'b');
    const ids = getHiddenIds('space_3');
    expect(ids.has('a')).toBe(true);
    expect(ids.has('b')).toBe(true);
    expect(ids.size).toBe(2);
  });

  it('hiding the same id twice does not duplicate it', () => {
    hideMessageForMe('space_4', 'x');
    hideMessageForMe('space_4', 'x');
    expect(getHiddenIds('space_4').size).toBe(1);
  });

  it('getHiddenIds on a space with nothing hidden returns an empty set', () => {
    expect(getHiddenIds('space_never_touched').size).toBe(0);
  });

  it('survives malformed stored JSON by treating it as empty rather than throwing', () => {
    const { Prefs } = require('@/store/mmkv');
    Prefs.set('local_hidden_messages_space_bad', 'not json{{{');
    expect(() => getHiddenIds('space_bad')).not.toThrow();
    expect(getHiddenIds('space_bad').size).toBe(0);
  });
});
