/**
 * Mock data for the re:sense UI shell (no backend yet).
 *
 * These stand in for the future Supabase `signals` / `resonances` tables so the
 * Board, Create, Reply, Resonance, Private-space, Reveal and Check-in screens
 * are fully navigable during the front-end pass. Replace with live queries when
 * the backend phase lands. Aliases only — never real names (privacy-first).
 */

export { SIGNAL_FORMATS, SIGNAL_MAX_CHARS, DAILY_SIGNAL_CAP } from '@/constants/signals';
export type { SignalFormat } from '@/constants/signals';
import type { SignalFormat } from '@/constants/signals';

export interface MockSignal {
  id: string;
  alias: string;
  text: string;          // ≤120 chars — the signal
  format: SignalFormat;
  postedAgo: string;     // human string, e.g. "2h"
  replies: number;
}

export const MOCK_SIGNALS: MockSignal[] = [
  { id: 's1', alias: 'quietfox',   text: 'the last warm evening before everything got busy again', format: 'memory',  postedAgo: '1h', replies: 2 },
  { id: 's2', alias: 'harbor_ln',  text: 'i keep leaving the kitchen light on for no one',           format: 'thought', postedAgo: '3h', replies: 0 },
  { id: 's3', alias: 'slowtide',   text: 'a station platform at 6am, coat still smelling of rain',    format: 'place',   postedAgo: '5h', replies: 4 },
  { id: 's4', alias: 'emberwake',  text: 'that specific quiet after laughing too hard',               format: 'feeling', postedAgo: '8h', replies: 1 },
  { id: 's5', alias: 'northroom',  text: 'wanting to be found without having to wave',                format: 'thought', postedAgo: '11h', replies: 3 },
];

export interface MockPrivateSpace {
  id: string;
  alias: string;          // the other person's alias
  lastLine: string;
  updatedAgo: string;
  fromSignal: string;     // the signal that started it
  revealed: boolean;      // whether both have chosen to reveal
}

export const MOCK_PRIVATE_SPACES: MockPrivateSpace[] = [
  { id: 'p1', alias: 'slowtide',  lastLine: 'i almost wrote something else first',       updatedAgo: '20m', fromSignal: 'a station platform at 6am…', revealed: false },
  { id: 'p2', alias: 'northroom', lastLine: 'no rush. i’m around this week.',            updatedAgo: '2d',  fromSignal: 'wanting to be found…',       revealed: true },
];

export interface MockThreadLine {
  id: string;
  mine: boolean;
  text: string;
}

export const MOCK_THREAD: MockThreadLine[] = [
  { id: 't1', mine: false, text: 'you added the part about the rain. i’ve been thinking about it.' },
  { id: 't2', mine: true,  text: 'it’s the smell more than the weather, i think.' },
  { id: 't3', mine: false, text: 'yeah. the coat keeps it for a day after.' },
];
