import {
  extractSpaceId,
  setPendingSpaceDeepLink,
  consumePendingSpaceDeepLink,
  peekPendingSpaceDeepLink,
} from './pushDeepLink';

describe('extractSpaceId', () => {
  it('returns the id for a well-formed response', () => {
    const resp = {
      notification: { request: { content: { data: { spaceId: 'abc' } } } },
    };
    expect(extractSpaceId(resp)).toBe('abc');
  });

  it('returns undefined for null', () => {
    expect(extractSpaceId(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(extractSpaceId(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty object', () => {
    expect(extractSpaceId({})).toBeUndefined();
  });

  it('returns undefined when data is an empty object', () => {
    const resp = { notification: { request: { content: { data: {} } } } };
    expect(extractSpaceId(resp)).toBeUndefined();
  });

  it('returns undefined when data is missing', () => {
    const resp = { notification: { request: { content: {} } } };
    expect(extractSpaceId(resp)).toBeUndefined();
  });

  it('coerces a non-string id to a string', () => {
    const resp = {
      notification: { request: { content: { data: { spaceId: 12345 } } } },
    };
    expect(extractSpaceId(resp)).toBe('12345');
  });

  it('rejects an empty string id', () => {
    const resp = {
      notification: { request: { content: { data: { spaceId: '' } } } },
    };
    expect(extractSpaceId(resp)).toBeUndefined();
  });

  it('rejects a whitespace-only id', () => {
    const resp = {
      notification: { request: { content: { data: { spaceId: '   ' } } } },
    };
    expect(extractSpaceId(resp)).toBeUndefined();
  });
});

describe('pending deep-link handoff', () => {
  beforeEach(() => {
    // Drain any pending value left over from a previous test.
    consumePendingSpaceDeepLink();
  });

  it('setPendingSpaceDeepLink then consumePendingSpaceDeepLink returns the id', () => {
    setPendingSpaceDeepLink('abc');
    expect(consumePendingSpaceDeepLink()).toBe('abc');
  });

  it('a second consume returns undefined (single-consume)', () => {
    setPendingSpaceDeepLink('abc');
    expect(consumePendingSpaceDeepLink()).toBe('abc');
    expect(consumePendingSpaceDeepLink()).toBeUndefined();
  });

  it('setPendingSpaceDeepLink(undefined) is a no-op and does not clear an existing pending id', () => {
    setPendingSpaceDeepLink('abc');
    setPendingSpaceDeepLink(undefined);
    expect(consumePendingSpaceDeepLink()).toBe('abc');
  });

  it('peekPendingSpaceDeepLink does not consume', () => {
    setPendingSpaceDeepLink('abc');
    expect(peekPendingSpaceDeepLink()).toBe('abc');
    expect(peekPendingSpaceDeepLink()).toBe('abc');
    expect(consumePendingSpaceDeepLink()).toBe('abc');
  });
});
