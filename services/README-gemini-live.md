# Gemini Live API — integration notes

- Live API docs: https://ai.google.dev/gemini-api/docs/live-api
- Coding-agent / MCP docs: https://ai.google.dev/gemini-api/docs/coding-agents

## Pattern for this app
1. Client requests an ephemeral token from the Cloudflare Worker (`server/`),
   which holds the real `GEMINI_API_KEY` and calls the Gemini token endpoint.
2. App opens a Live session with the ephemeral token via `connectLive()`.
3. The real API key never ships in the app bundle.

Implement `connectLive()` in `services/gemini.ts` against `@google/genai`'s
Live API once the worker token endpoint exists.
