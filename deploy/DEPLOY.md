# Publish Codex Desk at codex.1-kak.ru

DNS is already set to the VPS and the app is running on `127.0.0.1:3000`.
The `codexui` user has no sudo permission, so run the following as root or a sudo-enabled administrator. These commands do not stop or edit n8n containers.

```bash
set -e
install -m 0644 /opt/codex-ui/deploy/codex.1-kak.ru.nginx.conf /etc/nginx/sites-available/codex.1-kak.ru.conf
ln -s /etc/nginx/sites-available/codex.1-kak.ru.conf /etc/nginx/sites-enabled/codex.1-kak.ru.conf 2>/dev/null || true
nginx -t
systemctl reload nginx
certbot --nginx -d codex.1-kak.ru
```

After the certificate is issued, change `COOKIE_SECURE=false` to `COOKIE_SECURE=true` in `/opt/codex-ui/.env`, then restart the current UI process. Keep Cloudflare DNS as DNS only until HTTPS is confirmed. In Cloudflare SSL/TLS use `Full (strict)` after the origin certificate is installed.

Before and after the change, verify:

```bash
curl -I http://codex.1-kak.ru
curl -I https://codex.1-kak.ru
nginx -t
```

The certificate command may ask for an email and terms acceptance. Do not use `--force` or remove the existing n8n site.