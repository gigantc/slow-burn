# Deploy

Slow Burn runs as one Node process (Fastify serves `/api` and the built client) behind Apache, which only reverse-proxies the whole subdomain to `127.0.0.1:3100`. Server: Node 26, systemd, Apache + certbot.

`better-sqlite3` is a native module with per-platform prebuilt binaries, so `node_modules` is never rsynced (the Mac's darwin binary is useless on Linux). `deploy.sh` runs `npm ci --omit=dev` on the server instead. The `allowScripts` entry in `package.json` approves its install script by name.

## One-time server setup

Run on the server, in order. Examples assume `slowburn.gigantc.com` and `/opt/slow-burn`.

1. Create the service user and directories:

   ```bash
   useradd --system --home /opt/slow-burn --shell /usr/sbin/nologin slowburn
   mkdir -p /opt/slow-burn/data /opt/slow-burn/backups
   chown -R slowburn:slowburn /opt/slow-burn/data /opt/slow-burn/backups
   ```

2. Create `/opt/slow-burn/.env` (see `.env.example`). Generate the secrets on your Mac in the repo, then paste them in:

   ```bash
   npm run hash-password     # prompts; prints APP_PASSWORD_HASH
   npm run session-key       # prints SESSION_KEY
   ```

   ```bash
   chown root:slowburn /opt/slow-burn/.env
   chmod 640 /opt/slow-burn/.env
   ```

   Production values: `NODE_ENV=production`, `PORT=3100`, `HOST=127.0.0.1`, `DB_PATH=/opt/slow-burn/data/slowburn.db`.

3. Enable the Apache proxy modules:

   ```bash
   a2enmod proxy proxy_http
   ```

4. Install the vhost (from `deploy/slowburn.gigantc.com.conf`), enable it and reload:

   ```bash
   cp slowburn.gigantc.com.conf /etc/apache2/sites-available/
   a2ensite slowburn.gigantc.com
   systemctl reload apache2
   ```

5. HTTPS (certbot adds the 443 vhost and the redirect):

   ```bash
   certbot --apache -d slowburn.gigantc.com
   ```

6. Install and enable the systemd unit (from `deploy/slow-burn.service`). Confirm `ExecStart`'s node path matches `which node` on the server; fix the unit if not.

   ```bash
   cp slow-burn.service /etc/systemd/system/
   systemctl daemon-reload
   systemctl enable slow-burn
   ```

7. First deploy, from your Mac (the service starts at the end):

   ```bash
   cp deploy/.deploy.env.example deploy/.deploy.env   # edit if needed
   npm run deploy
   ```

8. Nightly backup, in root's crontab (`crontab -e`). Uses SQLite's online backup, so it is safe while the app runs:

   ```cron
   15 3 * * * sqlite3 /opt/slow-burn/data/slowburn.db ".backup /opt/slow-burn/backups/slowburn-$(date +\%F).db" && find /opt/slow-burn/backups -name 'slowburn-*.db' -mtime +30 -delete
   ```

   Needs the `sqlite3` CLI (`apt install sqlite3`).

## Every deploy

`npm run deploy` does: typecheck, build, rsync `dist/`, `drizzle/`, `package.json`, `package-lock.json`, `.nvmrc`, then on the server `npm ci --omit=dev`, `systemctl restart slow-burn`, and a health check against `/api/health`. Migrations run automatically when the server starts. It never sends `.env`, `data/`, `node_modules` or `src`.

## Troubleshooting

```bash
journalctl -u slow-burn -n 50
systemctl status slow-burn
curl -s http://127.0.0.1:3100/api/health
```
