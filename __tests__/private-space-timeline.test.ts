/**
 * __tests__/private-space-timeline.test.ts
 *
 * FEAT-4: every branch of buildTimeline (app/(app)/private-space-timeline.ts),
 * the pure reducer extracted from private-space.tsx's timeline useMemo
 * (:303-320). Pure data in, pure data out — no mocks.
 */
import { buildTimeline } from '@/app/(app)/private-space-timeline';
import type { Message } from '@/services/supabase';

const MY_ID = 'user-a';
const THEIR_ID = 'user-b';

function msg(overrides: Partial<Message> & { id: string; created_at: string }): Message {
  return {
    sender_id: MY_ID,
    space_id: 'space-1',
    text: 'hello',
    deleted_at: null,
    reply_to_id: null,
    ...overrides,
  } as Message;
}

interface EventLike {
  id: string;
  space_id: string;
  actor_id: string;
  kind: string;
  created_at: string;
}

function event(overrides: Partial<EventLike> & { id: string; created_at: string; kind: string }): EventLike {
  return {
    space_id: 'space-1',
    actor_id: MY_ID,
    ...overrides,
  };
}

describe('buildTimeline', () => {
  it('message-only: N messages in, N items out, all kind:"msg", chronological', () => {
    const messages = [
      msg({ id: 'm1', created_at: '2026-09-15T10:00:00.000Z' }),
      msg({ id: 'm2', created_at: '2026-09-15T10:01:00.000Z' }),
      msg({ id: 'm3', created_at: '2026-09-15T10:02:00.000Z' }),
    ];
    const result = buildTimeline({
      messages,
      events: [],
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    expect(result).toHaveLength(3);
    expect(result.every((it) => it.kind === 'msg')).toBe(true);
    expect(result.map((it) => (it.kind === 'msg' ? it.msg.id : null))).toEqual(['m1', 'm2', 'm3']);
  });

  it('slow_down-only: events map to kind:"event", eventKind:"slow_down", carrying id and mine', () => {
    const events = [
      event({ id: 'e1', kind: 'slow_down', actor_id: MY_ID, created_at: '2026-09-15T10:00:00.000Z' }),
      event({ id: 'e2', kind: 'slow_down', actor_id: THEIR_ID, created_at: '2026-09-15T10:01:00.000Z' }),
    ];
    const result = buildTimeline({
      messages: [],
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ kind: 'event', eventKind: 'slow_down', id: 'e1', mine: true });
    expect(result[1]).toMatchObject({ kind: 'event', eventKind: 'slow_down', id: 'e2', mine: false });
  });

  it('reveal-only: event maps with eventKind:"reveal" AND a resolved outcome', () => {
    const events = [event({ id: 'e1', kind: 'reveal', actor_id: THEIR_ID, created_at: '2026-09-15T10:00:00.000Z' })];
    const result = buildTimeline({
      messages: [],
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kind: 'event', eventKind: 'reveal', id: 'e1', mine: false });
    expect((result[0] as any).outcome).toBe('prompt-reciprocal');
  });

  it('mixed ordering: a reveal event timestamped between two messages lands in the correct chronological slot, alongside a slow_down', () => {
    const messages = [
      msg({ id: 'm1', created_at: '2026-09-15T10:00:00.000Z' }),
      msg({ id: 'm2', created_at: '2026-09-15T10:03:00.000Z' }),
    ];
    const events = [
      event({ id: 'e-reveal', kind: 'reveal', actor_id: THEIR_ID, created_at: '2026-09-15T10:01:00.000Z' }),
      event({ id: 'e-slow', kind: 'slow_down', actor_id: MY_ID, created_at: '2026-09-15T10:02:00.000Z' }),
    ];
    const result = buildTimeline({
      messages,
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    expect(result.map((it) => (it.kind === 'msg' ? it.msg.id : it.id))).toEqual(['m1', 'e-reveal', 'e-slow', 'm2']);
  });

  it('mine vs theirs via actor_id — for both slow_down and reveal', () => {
    const events = [
      event({ id: 'sd-mine', kind: 'slow_down', actor_id: MY_ID, created_at: '2026-09-15T10:00:00.000Z' }),
      event({ id: 'sd-theirs', kind: 'slow_down', actor_id: THEIR_ID, created_at: '2026-09-15T10:01:00.000Z' }),
      event({ id: 'rv-mine', kind: 'reveal', actor_id: MY_ID, created_at: '2026-09-15T10:02:00.000Z' }),
      event({ id: 'rv-theirs', kind: 'reveal', actor_id: THEIR_ID, created_at: '2026-09-15T10:03:00.000Z' }),
    ];
    const result = buildTimeline({
      messages: [],
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: true,
      bothRevealed: false,
    });
    const byId = Object.fromEntries(result.map((it) => [it.kind === 'event' ? it.id : '', it]));
    expect((byId['sd-mine'] as any).mine).toBe(true);
    expect((byId['sd-theirs'] as any).mine).toBe(false);
    expect((byId['rv-mine'] as any).mine).toBe(true);
    expect((byId['rv-theirs'] as any).mine).toBe(false);
  });

  it('locally-hidden message filtered out while its neighbours survive', () => {
    const messages = [
      msg({ id: 'm1', created_at: '2026-09-15T10:00:00.000Z' }),
      msg({ id: 'm2', created_at: '2026-09-15T10:01:00.000Z' }),
      msg({ id: 'm3', created_at: '2026-09-15T10:02:00.000Z' }),
    ];
    const result = buildTimeline({
      messages,
      events: [],
      myUserId: MY_ID,
      locallyHiddenIds: new Set(['m2']),
      iRevealed: false,
      bothRevealed: false,
    });
    expect(result.map((it) => (it.kind === 'msg' ? it.msg.id : null))).toEqual(['m1', 'm3']);
  });

  it('unknown event kind is ignored (defends the filter)', () => {
    const events = [
      event({ id: 'e1', kind: 'some_future_kind', actor_id: MY_ID, created_at: '2026-09-15T10:00:00.000Z' }),
    ];
    const result = buildTimeline({
      messages: [],
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    expect(result).toHaveLength(0);
  });

  it('duplicate reveal dedupe (§5.5): two reveal events from the same actor_id yield exactly one item carrying the EARLIEST created_at; two reveals from different actors yield two', () => {
    const events = [
      event({ id: 'dup-late', kind: 'reveal', actor_id: THEIR_ID, created_at: '2026-09-15T10:05:00.000Z' }),
      event({ id: 'dup-early', kind: 'reveal', actor_id: THEIR_ID, created_at: '2026-09-15T10:01:00.000Z' }),
      // A THIRD duplicate, later than the earliest already recorded — must
      // be discarded without replacing it (exercises the "existing already
      // earlier" branch, not just the "no existing yet" / "earlier than
      // existing" branches above).
      event({ id: 'dup-latest', kind: 'reveal', actor_id: THEIR_ID, created_at: '2026-09-15T10:06:00.000Z' }),
      event({ id: 'other-actor', kind: 'reveal', actor_id: MY_ID, created_at: '2026-09-15T10:02:00.000Z' }),
    ];
    const result = buildTimeline({
      messages: [],
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    const theirItems = result.filter((it) => it.kind === 'event' && it.mine === false);
    expect(theirItems).toHaveLength(1);
    expect((theirItems[0] as any).id).toBe('dup-early');
    expect(result).toHaveLength(2); // one theirs (deduped) + one mine
  });

  it('outcome wiring (§5.1) — the ANTI-REGRESSION test: iRevealed=false, bothRevealed=false, reveal event actor_id !== myUserId -> outcome MUST be "prompt-reciprocal". This fails if theyRevealed is ever wired to bothRevealed alone.', () => {
    const events = [event({ id: 'e1', kind: 'reveal', actor_id: THEIR_ID, created_at: '2026-09-15T10:00:00.000Z' })];
    const result = buildTimeline({
      messages: [],
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    expect((result[0] as any).outcome).toBe('prompt-reciprocal');
  });

  it('legacy mutual pair (§5.4): bothRevealed=true with only my own reveal event present still yields outcome:"already-mutual"', () => {
    const events = [event({ id: 'e-mine', kind: 'reveal', actor_id: MY_ID, created_at: '2026-09-15T10:00:00.000Z' })];
    const result = buildTimeline({
      messages: [],
      events,
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: true,
      bothRevealed: true,
    });
    expect((result[0] as any).outcome).toBe('already-mutual');
  });

  it('empty inputs: [] / [] -> [], no throw', () => {
    expect(() =>
      buildTimeline({
        messages: [],
        events: [],
        myUserId: MY_ID,
        locallyHiddenIds: new Set(),
        iRevealed: false,
        bothRevealed: false,
      }),
    ).not.toThrow();
    const result = buildTimeline({
      messages: [],
      events: [],
      myUserId: MY_ID,
      locallyHiddenIds: new Set(),
      iRevealed: false,
      bothRevealed: false,
    });
    expect(result).toEqual([]);
  });
});
