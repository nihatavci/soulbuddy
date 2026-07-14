/** Signal domain constants (formats, limits). Data now comes from Supabase. */

export type SignalFormat = 'feeling' | 'place' | 'memory' | 'thought';

export const SIGNAL_FORMATS: { value: SignalFormat; label: string; hint: string }[] = [
  { value: 'feeling', label: 'A feeling', hint: 'something you can’t quite name yet' },
  { value: 'place',   label: 'A place',   hint: 'somewhere that stayed with you' },
  { value: 'memory',  label: 'A memory',  hint: 'a moment you keep returning to' },
  { value: 'thought', label: 'A thought', hint: 'a half-sentence, left open' },
];

export const SIGNAL_MAX_CHARS = 120;
export const DAILY_SIGNAL_CAP = 3; // not enforced server-side yet (deferred)
