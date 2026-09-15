/**
 * context/__tests__/spaceUnread.test.ts
 *
 * Pure predicate table for the module extracted (and extended) from
 * context/UnreadContext.tsx per FEAT-3 step 1 + step 3. Every branch of
 * isSpaceUnread/hasUnread is asserted directly — no skips, no mocking of the
 * system under test, mirroring context/signalUnread.ts's own test convention.
 */
import { isSpaceUnread, hasUnread, CLOCK_SKEW_MARGIN_MS, type UnreadSpaceLike } from '@/context/spaceUnread';

const MY_ID = 'user_a_id';
const OTHER_ID = 'user_b_id';

describe('isSpaceUnread', () => {
  it('null space.id -> false, even with everything else pointing at "unread"', () => {
    const space: UnreadSpaceLike = { id: null, last_message_at: null, user_a: MY_ID, user_b: OTHER_ID };
    expect(isSpaceUnread(space, {}, MY_ID)).toBe(false);
  });

  it('undefined space.id -> false', () => {
    const space: UnreadSpaceLike = { last_message_at: null, user_a: MY_ID, user_b: OTHER_ID };
    expect(isSpaceUnread(space, {}, MY_ID)).toBe(false);
  });

  describe('message-less space (the FEAT-3 extension: a just-opened space with no messages yet)', () => {
    it('never-opened + I am user_a (the signal author, told nothing by the reply itself) -> unread', () => {
      const space: UnreadSpaceLike = { id: 'space_1', last_message_at: null, user_a: MY_ID, user_b: OTHER_ID };
      expect(isSpaceUnread(space, {}, MY_ID)).toBe(true);
    });

    it('marked read (a lastRead stamp exists for this space) -> not unread', () => {
      const space: UnreadSpaceLike = { id: 'space_1', last_message_at: null, user_a: MY_ID, user_b: OTHER_ID };
      const lastRead = { space_1: '2026-01-01T00:00:00.000Z' };
      expect(isSpaceUnread(space, lastRead, MY_ID)).toBe(false);
    });

    it('I am user_b (the creator who just opened it) -> not unread — a creator is never notified about their own creation', () => {
      const space: UnreadSpaceLike = { id: 'space_1', last_message_at: null, user_a: OTHER_ID, user_b: MY_ID };
      expect(isSpaceUnread(space, {}, MY_ID)).toBe(false);
    });

    it('I am neither user_a nor user_b (defensive: should not happen, but must not throw or misfire) -> not unread', () => {
      const space: UnreadSpaceLike = { id: 'space_1', last_message_at: null, user_a: OTHER_ID, user_b: 'someone_else' };
      expect(isSpaceUnread(space, {}, MY_ID)).toBe(false);
    });
  });

  describe('space with at least one message (pre-existing behaviour, byte-for-byte preserved)', () => {
    it('my own last message -> not unread (the BUG-4 guard), even with no lastRead stamp at all', () => {
      const space: UnreadSpaceLike = {
        id: 'space_1', last_message_at: '2026-01-01T00:00:05.000Z', last_message_sender_id: MY_ID,
        user_a: MY_ID, user_b: OTHER_ID,
      };
      expect(isSpaceUnread(space, {}, MY_ID)).toBe(false);
    });

    it('the other person\'s message, newer than my lastRead -> unread', () => {
      const space: UnreadSpaceLike = {
        id: 'space_1', last_message_at: '2026-01-01T00:00:05.000Z', last_message_sender_id: OTHER_ID,
        user_a: MY_ID, user_b: OTHER_ID,
      };
      const lastRead = { space_1: '2026-01-01T00:00:00.000Z' };
      expect(isSpaceUnread(space, lastRead, MY_ID)).toBe(true);
    });

    it('the other person\'s message, older than my lastRead -> not unread', () => {
      const space: UnreadSpaceLike = {
        id: 'space_1', last_message_at: '2026-01-01T00:00:00.000Z', last_message_sender_id: OTHER_ID,
        user_a: MY_ID, user_b: OTHER_ID,
      };
      const lastRead = { space_1: '2026-01-01T00:00:05.000Z' };
      expect(isSpaceUnread(space, lastRead, MY_ID)).toBe(false);
    });

    it('the other person\'s message, no lastRead stamp at all -> unread', () => {
      const space: UnreadSpaceLike = {
        id: 'space_1', last_message_at: '2026-01-01T00:00:05.000Z', last_message_sender_id: OTHER_ID,
        user_a: MY_ID, user_b: OTHER_ID,
      };
      expect(isSpaceUnread(space, {}, MY_ID)).toBe(true);
    });
  });
});

describe('hasUnread', () => {
  it('false for an empty list', () => {
    expect(hasUnread([], {}, MY_ID)).toBe(false);
  });

  it('false when every space is read/mine/creator-of', () => {
    const spaces: UnreadSpaceLike[] = [
      { id: 'space_1', last_message_at: null, user_a: OTHER_ID, user_b: MY_ID },
      {
        id: 'space_2', last_message_at: '2026-01-01T00:00:05.000Z', last_message_sender_id: MY_ID,
        user_a: MY_ID, user_b: OTHER_ID,
      },
    ];
    expect(hasUnread(spaces, {}, MY_ID)).toBe(false);
  });

  it('true when at least one space is unread', () => {
    const spaces: UnreadSpaceLike[] = [
      { id: 'space_1', last_message_at: null, user_a: OTHER_ID, user_b: MY_ID },
      { id: 'space_2', last_message_at: null, user_a: MY_ID, user_b: OTHER_ID },
    ];
    expect(hasUnread(spaces, {}, MY_ID)).toBe(true);
  });
});

describe('isSpaceUnread — F-6 watermark (unreadEpoch): a one-time local cutoff so a', () => {
  // build that introduces the message-less-unread extension does not light up
  // every pre-existing, never-opened, message-less space at once. Only spaces
  // CREATED BEFORE the epoch are suppressed; the epoch itself is inclusive of
  // "behaves as today" (>= epoch is untouched), matching the spec: "Spaces
  // created at or after unreadEpoch behave exactly as they do today."
  const EPOCH = '2026-06-01T00:00:00.000Z';

  it('created_at BEFORE the epoch by MORE than the clock-skew margin, never opened -> suppressed (not unread)', () => {
    // F1: genuinely pre-existing (31 days old), well beyond CLOCK_SKEW_MARGIN_MS.
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: '2026-05-01T00:00:00.000Z',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(false);
  });

  it('created_at BEFORE the epoch but WITHIN the clock-skew margin -> NOT suppressed (F1: the margin must absorb this)', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: '2026-05-31T23:59:59.999Z', // 1ms before epoch
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(true);
  });

  it('F1: created_at exactly CLOCK_SKEW_MARGIN_MS before the epoch -> NOT suppressed (boundary is exclusive)', () => {
    const createdAt = new Date(new Date(EPOCH).getTime() - CLOCK_SKEW_MARGIN_MS).toISOString();
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: createdAt,
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(true);
  });

  it('F1: created_at 1ms beyond CLOCK_SKEW_MARGIN_MS before the epoch -> IS suppressed (genuinely old)', () => {
    const createdAt = new Date(new Date(EPOCH).getTime() - CLOCK_SKEW_MARGIN_MS - 1).toISOString();
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: createdAt,
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(false);
  });

  it('F1: 2 hours of clock skew (device stamped the epoch 2h ahead of the server) no longer suppresses a space opened 5 minutes after launch', () => {
    const serverLaunch = new Date('2026-09-16T00:00:00.000Z').getTime();
    const skewedEpoch = new Date(serverLaunch + 2 * 60 * 60 * 1000).toISOString(); // device 2h ahead
    const createdAt = new Date(serverLaunch + 5 * 60 * 1000).toISOString(); // space opened 5 min after launch (server clock)
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: createdAt,
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, skewedEpoch)).toBe(true); // FAIL OPEN: must stay unread despite skew
  });

  it('F1: 90 seconds of clock skew still does not suppress a space opened 60 seconds after launch', () => {
    const serverLaunch = new Date('2026-09-16T00:00:00.000Z').getTime();
    const skewedEpoch = new Date(serverLaunch + 90 * 1000).toISOString(); // device 90s ahead
    const createdAt = new Date(serverLaunch + 60 * 1000).toISOString(); // space opened 60s after launch
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: createdAt,
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, skewedEpoch)).toBe(true);
  });

  it('created_at EXACTLY AT the epoch (boundary) -> NOT suppressed, still unread', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: EPOCH,
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(true);
  });

  it('created_at AFTER the epoch -> not suppressed, still unread (a genuinely new space must keep working)', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: '2026-06-01T00:00:00.001Z',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(true);
  });

  it('unparseable created_at (garbage string, not merely missing) -> cannot prove it predates the epoch, no suppression', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: 'not-a-real-date',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(true);
  });

  it('unparseable unreadEpoch (garbage string, not merely missing) -> cannot prove it predates the epoch, no suppression', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: '2026-05-01T00:00:00.000Z',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, 'also-not-a-real-date')).toBe(true);
  });

  it('missing unreadEpoch (e.g. not yet supplied by the provider) -> no suppression, pre-existing behaviour', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: '2020-01-01T00:00:00.000Z',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID)).toBe(true);
    expect(isSpaceUnread(space, {}, MY_ID, null)).toBe(true);
    expect(isSpaceUnread(space, {}, MY_ID, undefined)).toBe(true);
  });

  it('missing created_at, epoch present -> cannot prove it predates the epoch, so no suppression', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: null,
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(true);
  });

  it('a lastRead stamp still wins over the watermark entirely (already-covered case, unaffected)', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: '2026-06-05T00:00:00.000Z',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    const lastRead = { space_1: '2026-06-06T00:00:00.000Z' };
    expect(isSpaceUnread(space, lastRead, MY_ID, EPOCH)).toBe(false);
  });

  it('the watermark never touches a space WITH messages — message-driven path is entirely unaffected', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: '2026-06-05T00:00:05.000Z', last_message_sender_id: OTHER_ID,
      created_at: '2020-01-01T00:00:00.000Z', // ancient, pre-epoch — must not matter for message-driven spaces
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(true);
  });

  it('the BUG-4 guard (my own last message never unread) still holds with an epoch supplied', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: '2026-06-05T00:00:05.000Z', last_message_sender_id: MY_ID,
      created_at: '2020-01-01T00:00:00.000Z',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(false);
  });

  it('null space.id still returns false, even with everything else pointing at "suppress-me-not"', () => {
    const space: UnreadSpaceLike = {
      id: null, last_message_at: null, created_at: '2026-06-05T00:00:00.000Z',
      user_a: MY_ID, user_b: OTHER_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(false);
  });

  it('the creator (user_b) is still never unread for their own message-less space, watermark or not', () => {
    const space: UnreadSpaceLike = {
      id: 'space_1', last_message_at: null, created_at: '2026-06-05T00:00:00.000Z',
      user_a: OTHER_ID, user_b: MY_ID,
    };
    expect(isSpaceUnread(space, {}, MY_ID, EPOCH)).toBe(false);
  });
});

describe('hasUnread — F-6 watermark propagation', () => {
  const EPOCH = '2026-06-01T00:00:00.000Z';

  it('a list with only a pre-epoch message-less space is not unread', () => {
    const spaces: UnreadSpaceLike[] = [
      { id: 'space_1', last_message_at: null, created_at: '2026-05-01T00:00:00.000Z', user_a: MY_ID, user_b: OTHER_ID },
    ];
    expect(hasUnread(spaces, {}, MY_ID, EPOCH)).toBe(false);
  });

  it('a genuinely new (post-epoch) message-less space still flips hasUnread to true', () => {
    const spaces: UnreadSpaceLike[] = [
      { id: 'space_1', last_message_at: null, created_at: '2026-05-01T00:00:00.000Z', user_a: MY_ID, user_b: OTHER_ID },
      { id: 'space_2', last_message_at: null, created_at: '2026-06-02T00:00:00.000Z', user_a: MY_ID, user_b: OTHER_ID },
    ];
    expect(hasUnread(spaces, {}, MY_ID, EPOCH)).toBe(true);
  });
});
