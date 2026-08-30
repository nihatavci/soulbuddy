import { describeReplyOutcome } from './replyOutcome';

describe('describeReplyOutcome', () => {
  it('returns "resonance" when the mutation returned a space with an id (mutual resonance unlocked)', () => {
    expect(describeReplyOutcome({ id: 'space-123' })).toBe('resonance');
  });

  it('returns "pending" when space is null (no mutual resonance yet — the honest, common case)', () => {
    expect(describeReplyOutcome(null)).toBe('pending');
  });

  it('returns "pending" when space is undefined (space read-back failed) — indistinguishable from "no resonance yet" at this layer, which is still an honest description since neither case has a space to show', () => {
    expect(describeReplyOutcome(undefined)).toBe('pending');
  });

  it('returns "pending" when space is an object without an id', () => {
    expect(describeReplyOutcome({ id: null })).toBe('pending');
    expect(describeReplyOutcome({ id: '' })).toBe('pending');
  });
});
