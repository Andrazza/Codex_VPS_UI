# Audit — 2026-09-25

## Fixed and deployed

- Composer initialization crashed because HTML no longer included `#path`.
- Git status failure blocked chat initialization; it now reports independently.
- Project changes reset assistant/active state and reject stale Git responses.
- SSE reconnect now replaces a snapshot instead of appending duplicate history; server sends heartbeat comments.
- Failed submission retains the draft and displays the server error.
- Model preference is saved per project; mobile Enter inserts a newline and IME composition does not submit.
- GitHub URL parsing used `split(")")`; validation now accepts only GitHub owner/repository names.
- Import uses a hidden temporary directory, rejects existing targets, disables interactive SSH, and cleans up failure state.
- Concurrent requests now await Codex initialization; server requests cannot be mistaken for RPC responses with the same ID.
- Unsupported server requests receive an explicit error instead of hanging or being approved automatically.
- App-server restart clears stale thread references and releases active chats with an error.
- Backend secrets are excluded from app-server environment.
- Malformed cookie/login encoding cannot throw an uncaught decoding error.
- Concurrent turn creation is guarded before awaiting thread/start; failures release the active state.

## Verification

- `npm run typecheck`, `npm run build`, `git diff --check`.
- `node ui-regression.cjs src/public/app.js`: absent optional DOM element, repeated SSE snapshot, failed-send draft retention.
- `node --env-file=.env check.mjs`: health, all 15 project Git endpoints, concurrent models/limits, unauthorized access, malformed cookie, CSRF rejection, SSE snapshot.
- Optional `--chat` submits a no-tools AUDIT_OK prompt in scratch and waits for completion; performed successfully after restart.
- All 14 Git workspaces have a valid HEAD. `.env` is ignored.
- Native browser automation was unavailable; actual browser layout and phone interaction were not verified in this audit.

## Remaining limitations — do not present as completed MVP

- Approval buttons and additional user-input forms are not implemented. Unsupported requests fail explicitly; actions are not automatically approved.
- Chat history remains in memory and is lost on backend restart. Persistent sessions/new-chat/history UI remain unfinished.
- No systemd supervision, logout/session revocation UI, login rate limiter, or log rotation yet. Manual process restart is required.
- Git diff viewer and GitHub repository discovery/sync in the UI remain unfinished; Refresh reloads local directories only.
- Automated tests use a lightweight DOM harness, not a real browser. Full mobile/browser coverage remains necessary.
- This audit fixes the current functional regressions; it is not a certification of full security isolation or completion of every requirement in AGENTS.md.
