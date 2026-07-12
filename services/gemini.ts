import * as Sentry from '@sentry/react-native';
import { getConsentPreferences, hasGivenConsent } from '@/lib/consent';

// ─── Worker proxy config ─────────────────────────────────────────────────────
// The Gemini API key lives server-side in the Cloudflare Worker.
// All AI calls go through the authenticated proxy — no API key in the bundle.

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL ?? '';
if (__DEV__ && !WORKER_URL) {
  console.warn('[Gemini] Worker URL missing — add EXPO_PUBLIC_WORKER_URL to .env.local');
}

// ─── Auth token provider ─────────────────────────────────────────────────────
// Set once at app startup from a component that has access to useAuth().getToken.

let _getToken: (() => Promise<string | null>) | null = null;

/** Call once at app startup from a component that has useAuth().getToken */
export function setGeminiAuthProvider(getToken: () => Promise<string | null>) {
  _getToken = getToken;
}

// ─── Worker transport ────────────────────────────────────────────────────────

interface GeminiProxyRequest {
  model: string;
  contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>;
  generationConfig?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

interface GeminiProxyResponse {
  text: string | null;
  candidates?: Array<{
    content: { parts: Array<{ text?: string }> };
  }>;
}

/** L2: Request timeout — prevents hanging requests from blocking the UI indefinitely */
const GEMINI_REQUEST_TIMEOUT_MS = 60_000; // 60 seconds

async function callWorkerGemini(req: GeminiProxyRequest): Promise<GeminiProxyResponse> {
  // Respect AI processing consent — user can opt out in Profile > Privacy
  if (hasGivenConsent() && !getConsentPreferences().aiProcessing) {
    throw new Error('AI processing is disabled. Enable it in Profile > Privacy settings.');
  }

  // Retry token fetch up to 3× with 500ms backoff to handle the cold-start race
  // where the anonymous Supabase session hasn't been established yet.
  let token: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    token = _getToken ? await _getToken() : null;
    if (token) break;
    if (attempt < 2) await sleep(500);
  }
  if (!token) throw new Error('No auth token — user may not be signed in');

  // L2: AbortController timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: req.model,
        contents: req.contents,
        generationConfig: req.generationConfig,
        ...(req.config ?? {}),
      }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new Error(`Gemini request timed out after ${GEMINI_REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const errText = await res.text();
    // warn not error — these are handled upstream with fallback + Sentry capture,
    // we don't want the red LogBox overlay on expected 429/5xx responses.
    if (__DEV__) console.warn('[Gemini] Worker error:', errText);
    throw new Error(`Worker ${res.status}: ${errText}`);
  }

  const data = await res.json() as { candidates?: Array<{ content: { parts: Array<{ text?: string }> } }> };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  return { text, candidates: data?.candidates };
}

// ─── Models ───────────────────────────────────────────────────────────────────
// gemini-2.5-flash is the current multimodal fast + cheap default.
export const MODEL_MULTIMODAL = 'gemini-2.5-flash';
export const MODEL_TEXT       = 'gemini-2.5-flash';

// ─── Request timeout ──────────────────────────────────────────────────────────
const REQUEST_TIMEOUT_MS = 60_000;

export function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('GeminiTimeout')), ms),
    ),
  ]);
}

// ─── Session cache ────────────────────────────────────────────────────────────
// LRU-like: evict oldest entries when the cache exceeds MAX_CACHE_SIZE.
const MAX_CACHE_SIZE = 50;
const _cache = new Map<string, unknown>();

export function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (_cache.has(key)) return Promise.resolve(_cache.get(key) as T);
  return fn().then(result => {
    if (_cache.size >= MAX_CACHE_SIZE) {
      _cache.delete(_cache.keys().next().value!);
    }
    _cache.set(key, result);
    return result;
  });
}

// ─── In-flight deduplication ─────────────────────────────────────────────────
// If the same request fires twice (e.g. double-tap), the second call waits for
// the first and reuses its result. Prevents duplicate API charges.
const _inflight = new Map<string, Promise<unknown>>();

export function deduped<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (_inflight.has(key)) return _inflight.get(key) as Promise<T>;
  const p = fn().finally(() => _inflight.delete(key));
  _inflight.set(key, p);
  return p;
}

// ─── Retry with exponential backoff + jitter ─────────────────────────────────
export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return (
    m.includes('429') || m.includes('RESOURCE_EXHAUSTED') ||
    m.includes('500')  || m.includes('503') || m.includes('502') ||
    m.includes('UNAVAILABLE') || m.includes('INTERNAL') ||
    m.includes('Failed to fetch') ||
    m.includes('Network request failed') || m.includes('Worker') ||
    m.includes('Gemini returned empty response') ||
    m.includes('Gemini returned partial response')
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1_000,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn());
    } catch (err: unknown) {
      const isLast = attempt === retries;
      if (!isTransient(err) || isLast) throw err;
      // Exponential backoff: 1s → 2s → 4s, ±20% jitter
      const base  = baseDelayMs * 2 ** attempt;
      const jitter = base * 0.2 * (Math.random() * 2 - 1);
      await sleep(base + jitter);
    }
  }
  throw new Error('withRetry exhausted');
}

// ─── Markdown sanitizer ───────────────────────────────────────────────────────
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.*?)\*/g,     '$1')   // *italic*
    .replace(/__(.*?)__/g,     '$1')   // __bold__
    .replace(/_(.*?)_/g,       '$1')   // _italic_
    .replace(/`([^`]+)`/g,     '$1')   // `code`
    .replace(/^#+\s*/gm,       '')     // # headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // [link](url)
    .trim();
}

// ─── JSON extraction ─────────────────────────────────────────────────────────
// Gemini sometimes wraps JSON in markdown fences or adds leading/trailing text.
// This attempts to extract valid JSON even from noisy responses.

/** @internal exported for unit tests only */
export function extractJSON(raw: string): string {
  if (!raw || raw.trim().length === 0) {
    throw new Error('Gemini returned empty response');
  }
  let s = raw.replace(/```(?:json)?\n?/g, '').replace(/\n?```/g, '').trim();
  const firstBrace  = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error('Gemini response contains no JSON object');
  }
  const start = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
    ? firstBrace : firstBracket;
  const closer = s[start] === '{' ? '}' : ']';
  const end = s.lastIndexOf(closer);
  if (end <= start) {
    throw new Error('Gemini returned partial response');
  }
  const slice = s.slice(start, end + 1);
  // Verify brace balance: lastIndexOf finds the last closer but it may belong to a
  // nested object/array when the outer container was truncated (H2 regression).
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (const ch of slice) {
    if (escaped)            { escaped = false; continue; }
    if (ch === '\\')       { escaped = true;  continue; }
    if (ch === '"')         { inString = !inString; continue; }
    if (inString)           { continue; }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }
  if (depth !== 0) {
    throw new Error('Gemini returned partial response');
  }
  return slice;
}

// ─── Silent error reporting ───────────────────────────────────────────────────
// All Gemini errors are sent to Sentry for monitoring. Users never see them.
// Context tags let you filter by function in the Sentry dashboard.

export function reportError(fn: string, err: unknown, extra?: Record<string, unknown>): void {
  if (__DEV__) console.warn('[Gemini]', fn, err);
  Sentry.withScope(scope => {
    scope.setTag('gemini_function', fn);
    if (extra) scope.setContext('gemini', extra);
    Sentry.captureException(err);
  });
}

// ─── Generic text generation ──────────────────────────────────────────────────

/**
 * Send a plain-text prompt to Gemini and return the response text.
 * Falls back to extracting the first candidate's text from the response.
 */
export async function generateText(prompt: string, opts?: { model?: string }): Promise<string> {
  const response = await withRetry(() =>
    callWorkerGemini({
      model: opts?.model ?? MODEL_TEXT,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  );
  const text = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
}

// ─── Gemini Live API seam ─────────────────────────────────────────────────────
// Real-time, low-latency multimodal sessions. See services/README-gemini-live.md.
// SECURITY: never ship GEMINI_API_KEY in the app for production Live sessions —
// mint an ephemeral token from the Cloudflare Worker (server/) and pass it here.
export async function connectLive(_opts?: { ephemeralToken?: string }): Promise<never> {
  throw new Error('connectLive() not implemented — wire up per services/README-gemini-live.md');
}
