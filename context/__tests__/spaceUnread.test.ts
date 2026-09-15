/**
 * context/__tests__/spaceUnread.test.ts
 *
 * Pure predicate table for the module extracted (and extended) from
 * context/UnreadContext.tsx per FEAT-3 step 1 + step 3. Every branch of
 * isSpaceUnread/hasUnread is asserted directly — no skips, no mocking of the
 * system under test, mirroring context/signalUnread.ts's own test convention.
 */
import { isSpaceUnread, hasUnread, type UnreadSpaceLike } from '@/context/spaceUnread';

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
