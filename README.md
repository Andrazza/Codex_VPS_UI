# Codex Desk

Lightweight mobile-first interface for Codex on this VPS.

Current features:

- localhost-only Node.js server;
- magic-link authentication and 30-day session cookie;
- canonical project selection inside `/opt/codex-projects`;
- a `scratch` workspace that does not require Git or GitHub;
- branch/status display when a selected folder is a Git repository;
- Codex five-hour and weekly usage cards via `account/rateLimits/read`.

## Development run

```bash
npm install
npm run typecheck
npm run build
npm start
```

`codex login status` must report an authenticated ChatGPT account for usage cards and future conversations to work. The server remains bound to `127.0.0.1`; public access must go through authenticated HTTPS reverse proxy configuration.