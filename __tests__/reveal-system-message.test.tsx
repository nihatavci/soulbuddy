/**
 * __tests__/reveal-system-message.test.tsx
 *
 * FEAT-4: the styling + a11y contract for RevealSystemMessage
 * (components/private-space/RevealSystemMessage.tsx).
 *
 * Mocks only collaborators (i18n's real instance is used via LanguageProvider
 * — mirrors __tests__/private-space-reply-owed-nudge.test.tsx's pattern —
 * and `Alert` is mocked). The component under test is never mocked.
 */
import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import i18nInstance from '@/i18n';
import { LanguageProvider } from '@/context/LanguageContext';
import { RevealSystemMessage, formatEventTimeLocal } from '@/components/private-space/RevealSystemMessage';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// R2 fix: the production default (`formatEventTimeLocal`) renders the HOST's
// own local timezone and must never be hardcoded to a fixed zone again. Every
// render in this file therefore INJECTS this fixed-UTC formatter via the
// `formatEventTime` prop instead — that is how determinism is achieved here,
// not by pinning the process TZ or by hardcoding a zone into shipped code.
const FIXED_UTC_FORMATTER = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(iso));

// Bubble-identifying style values, sourced from `bubbleStyles` in
// app/(app)/private-space-bubble-style.ts (`bubble`, `bubbleMine`,
// `bubbleTheirs`) — referenced by symbol/module, not `file:line`, so a
// future relocation cannot make this stale again. This test reads the real
// component's rendered tree via its flattened `.style` prop and asserts it
// carries none of these values (a structural, not import-identity, check —
// which is exactly why it survived FEAT-1's relocation of these keys into
// that sibling module unchanged).
const BUBBLE_STYLE_VALUES = {
  bubbleRadius: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  bubbleMineBg: '#ECE5D9',
  bubbleTheirsBg: '#212125',
  bubbleMineTail: { borderBottomRightRadius: 6 },
  bubbleTheirsTail: { borderBottomLeftRadius: 6 },
};

// SystemNote's flat grey pill treatment — the `sysNote` style key in
// private-space.tsx's `StyleSheet.create` block (symbol reference, not
// `file:line`, so relocating that key cannot make this citation stale).
const SYS_NOTE_STYLE = { borderRadius: 999, backgroundColor: 'rgba(13,13,16,0.05)' };

function collectFlattenedStyles(tree: ReturnType<typeof render>): Record<string, unknown>[] {
  const styles: Record<string, unknown>[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (node.props && node.props.style != null) {
      const flat = StyleSheet.flatten(node.props.style);
      if (flat && typeof flat === 'object') styles.push(flat as Record<string, unknown>);
    }
    const children = node.children;
    if (Array.isArray(children)) children.forEach(walk);
  };
  const json = tree.toJSON();
  if (Array.isArray(json)) json.forEach(walk);
  else walk(json);
  return styles;
}

async function renderMessage(props: {
  mine?: boolean;
  alias?: string;
  outcome: 'prompt-reciprocal' | 'already-mutual' | 'passive-confirm' | 'noop';
  onConfirmReveal?: () => void;
  at?: string;
  formatEventTime?: (iso: string) => string;
}) {
  await i18nInstance.changeLanguage('en');
  return render(
    <LanguageProvider>
      <RevealSystemMessage
        mine={props.mine ?? false}
        alias={props.alias ?? 'Wren'}
        outcome={props.outcome}
        onConfirmReveal={props.onConfirmReveal ?? jest.fn()}
        at={props.at ?? '2026-09-01T14:32:00.000Z'}
        formatEventTime={props.formatEventTime ?? FIXED_UTC_FORMATTER}
      />
    </LanguageProvider>,
  );
}

describe('RevealSystemMessage — styling + a11y contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders and exposes accessibilityRole="button"', async () => {
    const tree = await renderMessage({ outcome: 'noop' });
    expect(tree.getByRole('button')).toBeTruthy();
  });

  it('carries none of styles.bubble / bubbleMine / bubbleTheirs (structural check, not name-based)', async () => {
    const tree = await renderMessage({ outcome: 'noop' });
    const flattened = collectFlattenedStyles(tree);
    const merged = Object.assign({}, ...flattened);

    // Neither bubble corner-radius pairing is present together.
    expect(
      merged.borderTopLeftRadius === BUBBLE_STYLE_VALUES.bubbleRadius.borderTopLeftRadius &&
        merged.borderTopRightRadius === BUBBLE_STYLE_VALUES.bubbleRadius.borderTopRightRadius,
    ).toBe(false);
    // Neither bubble background color appears on any node.
    expect(flattened.some((s) => s.backgroundColor === BUBBLE_STYLE_VALUES.bubbleMineBg)).toBe(false);
    expect(flattened.some((s) => s.backgroundColor === BUBBLE_STYLE_VALUES.bubbleTheirsBg)).toBe(false);
    // Neither bubble tail radius appears on any node.
    expect(flattened.some((s) => s.borderBottomRightRadius === 6)).toBe(false);
    expect(flattened.some((s) => s.borderBottomLeftRadius === 6)).toBe(false);
  });

  it("is distinct from SystemNote — does not carry its flat grey pill (borderRadius:999 + rgba(13,13,16,0.05))", async () => {
    const tree = await renderMessage({ outcome: 'noop' });
    const flattened = collectFlattenedStyles(tree);
    const hasSysNoteTreatment = flattened.some(
      (s) => s.borderRadius === SYS_NOTE_STYLE.borderRadius && s.backgroundColor === SYS_NOTE_STYLE.backgroundColor,
    );
    expect(hasSysNoteTreatment).toBe(false);
  });

  it('renders "mine" copy from reveal.eventMine when mine=true', async () => {
    const tree = await renderMessage({ mine: true, outcome: 'noop' });
    expect(tree.getByText('You chose to reveal')).toBeTruthy();
  });

  it('renders "theirs" copy from reveal.eventTheirs (interpolated with alias) when mine=false', async () => {
    const tree = await renderMessage({ mine: false, alias: 'Wren', outcome: 'noop' });
    expect(tree.getByText('Wren chose to reveal')).toBeTruthy();
  });

  it('tap on outcome="prompt-reciprocal" shows the Alert, and pressing confirm invokes onConfirmReveal', async () => {
    const onConfirmReveal = jest.fn();
    const tree = await renderMessage({
      mine: false,
      alias: 'Wren',
      outcome: 'prompt-reciprocal',
      onConfirmReveal,
      at: '2026-09-01T14:32:00.000Z',
    });

    fireEvent.press(tree.getByRole('button'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [title, message, buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    // R2 fix: title is an immutable, past-tense, point-in-time fact (a
    // `space_events` row, never deleted — FORK-4 Q3(i)) rather than a
    // present-tense claim that could be falsified by a withdrawal
    // (`hooks/useReveal.ts` `withdraw` only deletes `space_reveals`).
    expect(title).toBe('Wren revealed their name at 14:32');
    // The body must NOT assert the other person's name is currently
    // available, nor promise that reciprocating will definitely reveal it —
    // the client has no RLS-legible way to know if Wren's reveal is still
    // active (Option A: their `space_reveals` row is invisible pre-mutual).
    expect(message).toBe(
      "Nothing is shared until you also choose to reveal — and there's no guarantee Wren's reveal is still active.",
    );
    expect(message).not.toMatch(/to see it/i);
    expect(buttons).toHaveLength(2);
    expect(onConfirmReveal).not.toHaveBeenCalled();

    const confirmButton = buttons.find((b: any) => b.text === 'Reveal back');
    expect(confirmButton).toBeTruthy();
    confirmButton.onPress();
    expect(onConfirmReveal).toHaveBeenCalledTimes(1);
  });

  it('prompt-reciprocal title reflects the underlying event\'s own timestamp, not a hardcoded value', async () => {
    const tree = await renderMessage({
      mine: false,
      alias: 'Wren',
      outcome: 'prompt-reciprocal',
      at: '2026-01-15T09:05:00.000Z',
    });

    fireEvent.press(tree.getByRole('button'));

    const [title] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(title).toBe('Wren revealed their name at 09:05');
  });

  it('tap on outcome="already-mutual" shows an informational alert only; onConfirmReveal is never called', async () => {
    const onConfirmReveal = jest.fn();
    const tree = await renderMessage({ outcome: 'already-mutual', onConfirmReveal });

    fireEvent.press(tree.getByRole('button'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(onConfirmReveal).not.toHaveBeenCalled();
  });

  it('tap on outcome="passive-confirm" shows an informational alert only; onConfirmReveal is never called', async () => {
    const onConfirmReveal = jest.fn();
    const tree = await renderMessage({ outcome: 'passive-confirm', onConfirmReveal });

    fireEvent.press(tree.getByRole('button'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(onConfirmReveal).not.toHaveBeenCalled();
  });

  it('tap on outcome="noop" shows no Alert at all', async () => {
    const tree = await renderMessage({ outcome: 'noop' });

    fireEvent.press(tree.getByRole('button'));

    expect(Alert.alert).not.toHaveBeenCalled();
  });
});

describe('formatEventTimeLocal — production default renders the host/device local timezone (R2 fix)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('never passes a hardcoded timeZone to Intl.DateTimeFormat — proven by spying on the real constructor, not by trusting a comment', () => {
    // Wraps the REAL global constructor rather than replacing it, so the
    // underlying formatting still runs for real; only the call arguments are
    // observed. A regression that reintroduces `timeZone: 'UTC'` (or any
    // other fixed zone) into the shipped default fails this assertion
    // regardless of which timezone the machine running the suite is in.
    const ctorSpy = jest.spyOn(Intl, 'DateTimeFormat');

    const result = formatEventTimeLocal('2026-09-01T14:32:00.000Z');

    expect(ctorSpy).toHaveBeenCalledTimes(1);
    const [locale, options] = ctorSpy.mock.calls[0];
    expect(locale).toBe('en-GB');
    expect(options).not.toHaveProperty('timeZone');
    // Real formatting genuinely ran (not a stub returning a literal).
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('falls back to an empty string if Intl throws, without crashing', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unavailable');
    });

    expect(formatEventTimeLocal('2026-09-01T14:32:00.000Z')).toBe('');
  });
});
