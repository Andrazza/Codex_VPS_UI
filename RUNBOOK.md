# Runbook

## Verify

```bash
cd /opt/codex-ui
npm run typecheck
npm run build
curl http://127.0.0.1:3000/health
```

## Current manual restart

The temporary process PID is stored in `.stage1.pid`; restart it only as `codexui`. A systemd unit is not configured yet.

## HTTPS

Nginx proxies `codex.1-kak.ru` to `127.0.0.1:3000`. Keep `COOKIE_SECURE=true` in `.env`. The certificate is issued by Let’s Encrypt. Do not expose port 3000 or app-server.

## Rotation

To invalidate all browser sessions, replace `SESSION_SECRET` in `.env` with a new long random value and restart the UI. To replace the entry link, rotate `MAGIC_LINK_SECRET` in the same way.