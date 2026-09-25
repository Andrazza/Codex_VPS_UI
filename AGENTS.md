# Codex Desk — instructions for agents

This repository is the web interface for remote Codex on the VPS. The service lives in `/opt/codex-ui` and may work only with projects in `/opt/codex-projects`.

## Do not touch

- `/opt/n8n`, its Docker containers, PostgreSQL, Redis, backups, or configuration.
- Codex authentication files outside what the Codex CLI manages itself.
- Nginx configuration without a backup, `nginx -t`, and a successful test before reload.

## Runtime

- Node.js backend: `127.0.0.1:3000`.
- Public entry: Nginx → HTTPS → `https://codex.1-kak.ru`.
- Codex integration: child `codex app-server --stdio`; never expose app-server publicly.
- Configuration: `/opt/codex-ui/.env`, never commit it.

## Before finishing changes

Run `npm run typecheck`, `npm run build`, verify `curl http://127.0.0.1:3000/health`, inspect `git diff --check` and `git status`.