/**
 * __tests__/private-space-bubble-layout.test.tsx
 *
 * FEAT-1 (second attempt, depth-locked) — regression guard for the thread
 * bubble word-wrap bug fixed in `app/(app)/private-space-bubble-style.ts`.
 *
 * ROOT CAUSE (converged independently by a blind depth-prober and a G1
 * planner — see the run's evidence/FEAT-1-DEPTH-PROBE.md and
 * FEAT-1-G1-DEPTH-PLAN.md): the old `styles.bubble` carried its own
 * `maxWidth: '92%'`, but every ancestor between it and `bubbleRow` was
 * shrink-to-fit, so Yoga resolved that percentage against the bubble's OWN
 * natural width — shaving every bubble to 92% of itself and stealing 8% of
 * the text's content box (invisible on one unbreakable glyph, a visible
 * mid-word break from two glyphs up).
 *
 * HONEST SCOPE NOTE (verbatim from the frozen G1 plan, §7.1): no unit test
 * in this repository can prove the on-device wrap is fixed. `onLayout`
 * never fires under jest-expo, RNTL exports no measure API, and there is no
 * Yoga JS binding in this repo's node_modules. Every assertion below checks
 * STYLE OBJECTS (the invariant that produces correct layout), not pixels.
 * Do not read a pass here as proof the wrap is fixed on a real device — no
 * unit test in this repo can supply that proof, full stop. There is no
 * "G4 report" for this feature; do not cite one. The device-level evidence
 * lives entirely OUTSIDE this repo, in the run's own
 * `evidence/G6-VERIFY-FEAT-1-FEAT-4.md` (§7): an independent verifier's own
 * fresh simulator relaunch measured `bubble.width / bubbleSwipeAnchor.width`
 * going 0.92 -> exactly 1.000 across all eight arms (mine/theirs x
 * 1-char/2-char x before/after), with the rendered `<Text>` widening
 * 12.667 -> 17.667. That reproduction ran on a synthetic harness that
 * transcribes this module's real style chain, not on the live
 * `private-space` screen with two authenticated accounts — no such
 * end-to-end screenshot exists anywhere in this repo or the run directory.
 */
import { StyleSheet } from 'react-native';
import { bubbleStyles, composeBubbleStyles, type BubbleStyleState } from '@/app/(app)/private-space-bubble-style';

// Every layout-affecting width-ish property Yoga honors on a View.
const WIDTH_PROPS = ['width', 'minWidth', 'maxWidth', 'flexBasis', 'flex', 'alignSelf'] as const;

// The six branch combos this module must support: {mine, theirs} x
// {confirmed, pending, deleted}. `confirmed` is simply pending=false,
// deleted=false — there is no third boolean, so it is expressed that way.
const BRANCHES: Array<{ label: string; state: BubbleStyleState }> = [
  { label: 'mine, confirmed', state: { mine: true, pending: false, deleted: false } },
  { label: 'mine, pending', state: { mine: true, pending: true, deleted: false } },
  { label: 'mine, deleted', state: { mine: true, pending: false, deleted: true } },
  { label: 'theirs, confirmed', state: { mine: false, pending: false, deleted: false } },
  { label: 'theirs, pending', state: { mine: false, pending: true, deleted: false } },
  { label: 'theirs, deleted', state: { mine: false, pending: false, deleted: true } },
];

describe('private-space-bubble-style — composeBubbleStyles', () => {
  // Clause 1: all six branch combos are supported and produce a style
  // object for every slot, with no snapshot (explicit property reads only).
  describe.each(BRANCHES)('clause 1: branch $label', ({ state }) => {
    it('returns a fully-populated composed style group', () => {
      const composed = composeBubbleStyles(state);
      expect(composed.row).toBeTruthy();
      expect(composed.anchor).toBeTruthy();
      expect(composed.replyIcon).toBeTruthy();
      expect(composed.bubbleContainer).toBeTruthy();
      expect(composed.innerRow).toBeTruthy();
      expect(composed.text).toBeTruthy();
      expect(composed.pendingIcon).toBeTruthy();
    });
  });

  // Clause 2: zero width constraints in the flattened CONTAINER stack
  // (row -> bubbleContainer -> innerRow) in every branch. `anchor` is
  // deliberately excluded here — it is the one node asserted to carry the
  // constraint, checked separately in clause 3.
  describe.each(BRANCHES)('clause 2: branch $label', ({ state }) => {
    it('has no width constraint anywhere in the container stack (excluding the anchor)', () => {
      const composed = composeBubbleStyles(state);
      const flattenedRow = StyleSheet.flatten(composed.row);
      const flattenedBubble = StyleSheet.flatten(composed.bubbleContainer);
      const flattenedInnerRow = StyleSheet.flatten(composed.innerRow);

      for (const flattened of [flattenedRow, flattenedBubble, flattenedInnerRow]) {
        for (const prop of WIDTH_PROPS) {
          expect(flattened[prop as keyof typeof flattened]).toBeUndefined();
        }
      }
    });
  });

  // Clause 3: `bubbleSwipeAnchor` is the single surviving width constraint,
  // still `maxWidth: '92%'` — asserted positively AND by exhaustion over
  // every other exported key.
  it('clause 3: bubbleSwipeAnchor is the sole surviving width constraint at maxWidth 92%', () => {
    expect(StyleSheet.flatten(bubbleStyles.bubbleSwipeAnchor).maxWidth).toBe('92%');

    for (const [key, value] of Object.entries(bubbleStyles)) {
      if (key === 'bubbleSwipeAnchor') continue;
      const flattened = StyleSheet.flatten(value as never);
      for (const prop of WIDTH_PROPS) {
        expect(flattened[prop as keyof typeof flattened]).toBeUndefined();
      }
    }
  });

  // Clause 4 (INV-1 guard, generalises past the one deleted line): no OTHER
  // exported key may hold a percentage-valued width/minWidth/maxWidth. This
  // fails if a future reader re-adds a percentage cap to `bubble`,
  // `bubbleMine`, `bubbleInnerRow`, or any future wrapper — not just the one
  // line this fix deleted.
  it('clause 4: INV-1 — only bubbleSwipeAnchor may hold a percentage-valued width/minWidth/maxWidth', () => {
    const percentageHolders: string[] = [];
    for (const [key, value] of Object.entries(bubbleStyles)) {
      const flattened = StyleSheet.flatten(value as never) as Record<string, unknown>;
      for (const prop of ['width', 'minWidth', 'maxWidth']) {
        const v = flattened[prop];
        if (typeof v === 'string' && v.trim().endsWith('%')) {
          percentageHolders.push(key);
        }
      }
    }
    expect(percentageHolders).toEqual(['bubbleSwipeAnchor']);
  });

  // "No minWidth/width in the text stack."
  it('has no width or minWidth in the text stack, in every branch', () => {
    for (const { state } of BRANCHES) {
      const composed = composeBubbleStyles(state);
      const flattenedText = StyleSheet.flatten(composed.text);
      expect(flattenedText.width).toBeUndefined();
      expect(flattenedText.minWidth).toBeUndefined();
    }
  });

  // Clause 5: flexShrink:1 is pinned as deliberately out of scope for this
  // fix (proven inert by the G1 plan's C1 experiment) — a future reader
  // must not "clean it up" and mistake the resulting no-op for a fix.
  it('clause 5: bubbleText.flexShrink stays 1 (deliberately out of scope, proven inert)', () => {
    expect(StyleSheet.flatten(bubbleStyles.bubbleText).flexShrink).toBe(1);
  });

  it('regression guard: a long multi-word message still caps via bubbleSwipeAnchor only', () => {
    // The long-message cap is unaffected by this fix by construction: the
    // anchor's maxWidth:'92%' is untouched, and the bubble container never
    // had a width constraint added back. This is a structural, not pixel,
    // guard — see the honest scope note at the top of this file.
    const composed = composeBubbleStyles({ mine: true, pending: false, deleted: false });
    expect(StyleSheet.flatten(composed.anchor).maxWidth).toBe('92%');
    expect(StyleSheet.flatten(composed.bubbleContainer).maxWidth).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// RNTL render of the real ThreadBubble component, wired to composeBubbleStyles.
// ---------------------------------------------------------------------------

const mockUseLocalSearchParams = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: jest.fn(), push: jest.fn() })),
  useLocalSearchParams: (...args: unknown[]) => mockUseLocalSearchParams(...args),
}));

jest.mock('@/hooks/useSpaces', () => ({
  usePrivateSpaces: jest.fn(() => ({ data: [] })),
  otherAlias: jest.fn(() => ''),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user_a' } })),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Warning: 'warning', Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('@/hooks/useMessages', () => ({
  useMessages: jest.fn(() => ({ data: [] })),
  useSendMessage: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useDeleteMessageForEveryone: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock('@/context/UnreadContext', () => ({
  useUnreadContext: jest.fn(() => ({ markSpaceRead: jest.fn() })),
}));

jest.mock('@/hooks/useReveal', () => ({
  useReveal: jest.fn(() => ({ iRevealed: false, bothRevealed: false, other: null })),
}));

jest.mock('@/hooks/useSpaceEvents', () => ({
  useSpaceEvents: jest.fn(() => ({ data: [] })),
  useSendSlowDown: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock('@/lib/localMessageHide', () => ({
  hideMessageForMe: jest.fn(),
  getHiddenIds: jest.fn(() => new Set()),
}));

jest.mock('@/components/glow', () => ({
  Toast: { show: jest.fn() },
}));

jest.mock('@/hooks/useReplyOwedPrompt', () => ({
  useReplyOwedPrompt: jest.fn(() => ({ showNudge: false, dismiss: jest.fn() })),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import i18nInstance from '@/i18n';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThreadBubble } from '@/app/(app)/private-space';
import type { Message } from '@/services/supabase';

function msg(overrides: Partial<Message> & { id: string; text: string; sender_id: string }): Message {
  return {
    space_id: 'space_1',
    created_at: '2026-09-01T00:00:00.000Z',
    deleted_at: null,
    reply_to_id: null,
    ...overrides,
  } as Message;
}

function renderBubble(message: Message, mine: boolean) {
  return render(
    <LanguageProvider>
      <ThreadBubble
        message={message}
        mine={mine}
        onDeletePress={() => {}}
        onSwipeReply={() => {}}
        allMessages={[message]}
        alias="Wren"
        currentUserId="user_a"
      />
    </LanguageProvider>,
  );
}

describe('private-space.tsx — ThreadBubble, wired to composeBubbleStyles', () => {
  beforeAll(async () => {
    await i18nInstance.changeLanguage('en');
  });

  it('renders a 2-character mine message without crashing', () => {
    expect(() => renderBubble(msg({ id: 'm1', text: 'Sa', sender_id: 'user_a' }), true)).not.toThrow();
  });

  it('renders a 2-character theirs message without crashing', () => {
    expect(() => renderBubble(msg({ id: 'm2', text: 'Sa', sender_id: 'user_b' }), false)).not.toThrow();
  });

  it('renders a 1-character message (mine and theirs) without crashing', () => {
    expect(() => renderBubble(msg({ id: 'm3', text: 'A', sender_id: 'user_a' }), true)).not.toThrow();
    expect(() => renderBubble(msg({ id: 'm4', text: 'A', sender_id: 'user_b' }), false)).not.toThrow();
  });

  it('long-text regression guard: renders a long multi-word message without crashing', () => {
    const long = 'This is a much longer message with plenty of natural word-break opportunities in it';
    expect(() => renderBubble(msg({ id: 'm5', text: long, sender_id: 'user_a' }), true)).not.toThrow();
  });

  it('a confirmed bubble uses the anchor as its only width constraint (structural, not pixel)', () => {
    const tree = renderBubble(msg({ id: 'm6', text: 'Sa', sender_id: 'user_a' }), true);
    // Find the anchor node structurally: it is the one View in the tree
    // whose flattened style carries maxWidth. There must be exactly one.
    const json = tree.toJSON();
    const widthHolders: unknown[] = [];
    const visit = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const n = node as { props?: { style?: unknown }; children?: unknown[] };
      if (n.props?.style) {
        const flat = StyleSheet.flatten(n.props.style as never) as Record<string, unknown>;
        if (flat.maxWidth !== undefined) widthHolders.push(flat.maxWidth);
      }
      (n.children ?? []).forEach(visit);
    };
    visit(json);
    expect(widthHolders).toEqual(['92%']);
  });
});
