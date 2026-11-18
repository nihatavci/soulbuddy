import { revealTapOutcome, type RevealTapOutcome } from './revealTransition';

describe('revealTapOutcome — all eight cells of the 2x2x2 table (FEAT-4 §5.2, frozen)', () => {
  it('cell 1: iRevealed=false, theyRevealed=false, tapperIsActor=false -> noop (defensive-unreachable via the sole caller today; kept to fully specify this general-purpose function\'s input domain — see revealTransition.ts DEFENSIVE-UNREACHABLE note)', () => {
    expect(revealTapOutcome({ iRevealed: false, theyRevealed: false, tapperIsActor: false })).toBe('noop');
  });

  it('cell 2: iRevealed=false, theyRevealed=false, tapperIsActor=true -> noop (my own stale notice after I withdrew)', () => {
    expect(revealTapOutcome({ iRevealed: false, theyRevealed: false, tapperIsActor: true })).toBe('noop');
  });

  it('cell 3: iRevealed=false, theyRevealed=true, tapperIsActor=false -> prompt-reciprocal (THE core case)', () => {
    expect(revealTapOutcome({ iRevealed: false, theyRevealed: true, tapperIsActor: false })).toBe(
      'prompt-reciprocal',
    );
  });

  it('cell 4: iRevealed=false, theyRevealed=true, tapperIsActor=true -> noop (my notice, but I withdrew; theirs stands)', () => {
    expect(revealTapOutcome({ iRevealed: false, theyRevealed: true, tapperIsActor: true })).toBe('noop');
  });

  it('cell 5: iRevealed=true, theyRevealed=false, tapperIsActor=false -> noop (defensive-unreachable via the sole caller today, same structural reason as cell 1 — see revealTransition.ts DEFENSIVE-UNREACHABLE note)', () => {
    expect(revealTapOutcome({ iRevealed: true, theyRevealed: false, tapperIsActor: false })).toBe('noop');
  });

  it('cell 6: iRevealed=true, theyRevealed=false, tapperIsActor=true -> passive-confirm (my notice, confirm + reassure)', () => {
    expect(revealTapOutcome({ iRevealed: true, theyRevealed: false, tapperIsActor: true })).toBe('passive-confirm');
  });

  it('cell 7: iRevealed=true, theyRevealed=true, tapperIsActor=false -> already-mutual (never the prompt)', () => {
    expect(revealTapOutcome({ iRevealed: true, theyRevealed: true, tapperIsActor: false })).toBe('already-mutual');
  });

  it('cell 8: iRevealed=true, theyRevealed=true, tapperIsActor=true -> already-mutual (same, regardless of whose notice)', () => {
    expect(revealTapOutcome({ iRevealed: true, theyRevealed: true, tapperIsActor: true })).toBe('already-mutual');
  });

  it('sweeps all 8 boolean triples: always returns one of the four literals, never undefined', () => {
    const outcomes: RevealTapOutcome[] = ['prompt-reciprocal', 'already-mutual', 'passive-confirm', 'noop'];
    const seen = new Set<string>();
    for (const iRevealed of [false, true]) {
      for (const theyRevealed of [false, true]) {
        for (const tapperIsActor of [false, true]) {
          const key = JSON.stringify({ iRevealed, theyRevealed, tapperIsActor });
          seen.add(key);
          const result = revealTapOutcome({ iRevealed, theyRevealed, tapperIsActor });
          expect(outcomes).toContain(result);
        }
      }
    }
    // Guards against a future edit silently dropping a case: exactly 8
    // distinct input combinations must have been exercised.
    expect(seen.size).toBe(8);
  });

  it('distribution matches the frozen table exactly: 1 prompt-reciprocal, 1 passive-confirm, 2 already-mutual, 4 noop', () => {
    const counts: Record<RevealTapOutcome, number> = {
      'prompt-reciprocal': 0,
      'already-mutual': 0,
      'passive-confirm': 0,
      noop: 0,
    };
    for (const iRevealed of [false, true]) {
      for (const theyRevealed of [false, true]) {
        for (const tapperIsActor of [false, true]) {
          counts[revealTapOutcome({ iRevealed, theyRevealed, tapperIsActor })] += 1;
        }
      }
    }
    expect(counts).toEqual({
      'prompt-reciprocal': 1,
      'passive-confirm': 1,
      'already-mutual': 2,
      noop: 4,
    });
  });
});
