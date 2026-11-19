# Slow Burn

**Slow Burn. Smoke, sip, savor, repeat.** A journal for the unhurried.

A personal, phone-first journal for backyard rituals: logging smoking cooks as a timeline, and tastings (whisky, cigar, wine). Single user (dFree). Entries are captured on the phone and browsed on the Mac.

**Owner:** dFree  ·  **Live URL:** TBD (self-hosted on DigitalOcean)  ·  **Figma:** none yet

---

## Project status

- **Requirements:** product brief (Claude Doc): https://claude.ai/artifact/6sehEn6JqjofPmVYrbKsiR
- **Current phase:** kickoff. The folder was created on 2026-11-18; no code, no git repo yet.
---

## Background

This replaces The Dock (`~/Sites/dev/The-Dock`), an all-in-one notes/lists/journals app built for an AI agent that published content. That premise is gone, so dFree decided on **separate single-purpose apps**. Notes stay in Apple Notes and Lists stay in Clear for now. Slow Burn is first because nothing else tracks smoking meat. **Don't carry over The Dock's design or architecture.**

---

## Product (summary of the brief)

- **Cooks** are timelines over hours. Setup (meat, weight, target meat temp, target pit temp, wood, prep), timestamped events with one tap each (on, pit temp, internal temp, spritz, wrap, add wood, off, rest), then a wrap-up (final temp, total time calculated, rating, notes, photos).
- **"Next time" note:** written after a cook and shown first when starting the next cook of the same meat. This is a core feature.
- **Tastings** are single moments. Whisky, cigar and wine share one form (name, maker, date, impressions, rating, photo), and each category adds its own fields. New categories should be data, not code.
- **Principles:** phone first; big tap targets ("greasy hands"); works with bad signal; every field optional except the meat; desktop is for looking back (browse, search, sort by rating).

---

## Stack

- **Language:** TypeScript (strict) everywhere. One `package.json`, ESM, Node 26 (`.nvmrc`), npm.
- **Frontend:** React + Vite + react-router. SCSS via CSS Modules (`*.module.scss`).
- **Backend:** Fastify (TypeBox validation via `@fastify/type-provider-typebox`), serving `/api` and the built client (SPA fallback). Compiled with `tsc` to `dist/server`.
- **Database:** SQLite via better-sqlite3 + Drizzle. `src/server/db/schema.ts` is the source of truth; migrations in `drizzle/` are generated, never hand-edited, and run at server start.
- **Auth:** single user. Password hash in `APP_PASSWORD_HASH` (scrypt), session cookie via `@fastify/secure-session` (about 1 year). One guard in `src/server/auth/guard.ts`.
- **Config:** server constants in `src/server/config.ts` (reads env, see `.env.example`); client constants in `src/client/config.ts`.
- **Event types are data:** `src/shared/cookEventTypes.ts`.
- **Photos:** server disk, resized to WebP on upload. Not built yet.
- **Offline:** PWA service worker (`vite-plugin-pwa`, `/api` is network-only) plus a local-first data layer in `src/client/lib/`: IndexedDB cache and outbox (`idb.ts`, `cookStore.ts`), a sync engine (`sync.ts`), one transport module (`transport.ts`), actions and hooks (`cookActions.ts`, `cookHooks.ts`). Writes land locally first and sync in the background; the server resolves conflicts last-write-wins on the client's `updatedAt`. Ratings are 1 to 5 stars; temps are °F.
- **Hosting:** DigitalOcean, systemd + Apache reverse proxy + certbot. See [docs/deploy.md](docs/deploy.md).
- **Design:** Sonoran palette in two themes, **Dawn** (light) and **Dusk** (dark), user toggle (labels in `THEME_LABELS`, client config; internal keys stay `light`/`dark`), defaults to the system setting. Tokens in `src/client/scss/_variables.scss`; fonts are self-hosted variable woff2 in `src/client/fonts/` (Fraunces for h1-h3, DM Sans for everything else; tokens `$font-display` and `$font-body`). The redesign spec (palettes, category colors, sky gradients, components, screens) is [docs/design-system.md](docs/design-system.md); the design canvas is https://claude.ai/artifact/WvB2upNaVGdWnYCqPobF3E.
- **Not used:** Firebase, Netlify, Tailwind.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite (5173, proxies `/api`) + `tsx watch` server (3100). Needs a `.env`. |
| `npm run build` | Client (Vite to `dist/client`) then server (`tsc` to `dist/server`) |
| `npm run typecheck` | Client and server `tsc --noEmit` |
| `npm start` | Run the built server |
| `npm run db:generate` | Generate a Drizzle migration from the schema |
| `npm run db:migrate` | Apply migrations manually (the server also does this at start) |
| `npm run hash-password` | Print `APP_PASSWORD_HASH` |
| `npm run session-key` | Print `SESSION_KEY` |
| `npm run deploy` | Typecheck, build, rsync, restart, health check |
| `npm run format` | Prettier (skips `.scss`) |

First run: `cp .env.example .env`, fill in the two secrets, `npm run dev`.

---

## Repo layout

```
src/
  client/    main.tsx, App.tsx, config.ts, scss/, lib/, components/, routes/
  server/    index.ts, app.ts, config.ts, errors.ts, auth/, db/, routes/
  shared/    types and data used by both sides
drizzle/     generated migrations
deploy/      deploy.sh, systemd unit, Apache vhost
docs/        deploy.md
scripts/     hash-password, session-key
public/      robots.txt, icons/ (PWA icons live here)
data/        SQLite file (gitignored)
```

Client imports use `@/` (src/client) and `shared/` (src/shared). Server imports use relative paths with `.js` extensions (NodeNext).

---

## Deviations from global rules

- CSS Modules (`*.module.scss`) imported per component instead of auto-imported partials.
- `global.scss` (reset + base) is imported once from `main.tsx`.
- `routes/` instead of `containers/`.
- Theme palettes are Sass maps emitted as CSS custom properties under `[data-theme]` (`scss/_themes.scss`), because the theme switches at runtime. Components use semantic Sass tokens only (`v.$panel`, `v.$accent`), never theme names.
- Prettier skips `.scss` so the compact SCSS style survives.

---

## Gotchas

- **The CSS minifier reorders declarations.** It can merge same-selector rules and move `font-variant-numeric` / `font-variation-settings` ahead of the `font` shorthand, which then resets them. Put those in a separate rule (e.g. a child selector) and check the built CSS, not just the source.
- **The service worker caches old builds.** After a change, hard-reload (or wipe the headless browser profile) before judging a screenshot.

---

## Current state

- **Last worked on:** 2026-11-18. Cook MVP built end to end (new cook, live, wrap-up, detail, Cooks tab), offline-first sync, menu, Sonoran Dawn/Dusk design, Fraunces + DM Sans, gradient flame logo. Walkthrough with dFree reworked the cook form: Name/Protein/Cut/Smoker removed, **Meat** (managed list with add-new picker) is the star and the only required field, target meat temp added, Cancel/primary action bar replaced the close button, live screen tiles removed in favor of targets in the header. Not yet tested on a real phone.
- **Server facts (2026-11-18):** Ubuntu 24.04 LAMP droplet, Node v26.13.1 via NodeSource (upgraded from 22 on 2026-11-18; `baseball-watcher` verified healthy after), certbot certs per subdomain, `slowburn.gigantc.com` DNS already resolves to the droplet. `mod_proxy` / `proxy_http` not enabled yet. No databases used by the other sites.
- **In progress:** nothing. dFree is walking through the app screen by screen and dumping feedback; the look is a placeholder and a real design pass is planned later.
- **Next up:**
  1. Bug: on desktop the sticky form action bar overlaps the bottom of the last section card (panel needs bottom padding equal to the bar height).
  2. Continue the walkthrough (detail, Cooks tab, home). Wrap-up is good for now.
  3. Test on a real phone: `vite --host` over Wi-Fi now; a private staging deploy later in the week for PWA install + offline (dFree decides when).
  4. ~~PWA icons~~ Done 2026-11-19: logo finalized and exported (see Logo in docs/design-system.md). Still to do: build the horizontal lockup into the `Logo` component for the sidebar and header.
  5. Polish pile: Dusk whisky card muddy, Dusk wine too saturated, Dawn secondary button on the backdrop washed out, Undo toast covers the Note button.
  6. Later: "Manage meats" (rename, merge, delete unused) in the menu.
- **Dev DB note:** a running `npm run dev` re-applies migrations as files change, so stop it while the schema is being edited.
- **Data to re-enter:** The Dock's smoking and whisky notes are free-text Firestore entries (no structured fields). They'll be re-entered by hand as test data, which is why a cook with zero events and a past date is valid.
- **Decided:** no deadline (the Thanksgiving target was dropped on 2026-11-19). Rating is 5 stars (integer 1 to 5), the same for cooks and tastings. Temps are °F only. Sign out and the Dawn/Dusk theme switch live in a menu (sidebar popover on desktop, tab-bar sheet on phone).
