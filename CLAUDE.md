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
- **Tasting categories are data:** `src/shared/tastingCategories.ts` (spec and note fields per category). Adding a category is a registry row plus a row in `$categories` (`_variables.scss`). One `tastings` table with category-specific values in a JSON `details` column, validated against the registry. Tasting screens recolor through `data-category` on `<html>` (`useCategoryAccent`), using the `$cat*` tokens.
- **Photos:** one `photos` table for cooks and tastings (many per entry, one featured, optional caption). Phones resize to a 2000px JPEG before upload (`lib/imageResize.ts`); the server (sharp) writes a 1600px display and 480px thumb WebP with all metadata stripped, to `PHOTOS_DIR` (default `data/photos`) behind `src/server/photos/storage.ts`. Uploads queue offline through the outbox (blobs in IndexedDB); the service worker caches `/api/photos/*`. Back up `data/photos` with the DB; check Apache's body-size limit (15 MB max upload) at deploy.
- **Offline:** PWA service worker (`vite-plugin-pwa`, `/api` is network-only) plus a local-first data layer in `src/client/lib/`: IndexedDB cache and outbox (`idb.ts`, `store.ts`, `storeHooks.ts`), a sync engine (`sync.ts`), one transport module (`transport.ts`), actions and hooks (`cookActions.ts`, `cookHooks.ts`, `tastingActions.ts`, `tastingHooks.ts`). Writes land locally first and sync in the background; the server resolves conflicts last-write-wins on the client's `updatedAt`. Ratings are 1 to 5 stars; temps are °F.
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

- **Last worked on:** 2026-11-19. Real design pass from the canvas, done for every cook screen in Dawn and Dusk, phone and desktop: new tokens and typography, app shell (desktop sidebar on the sky, phone tab bar), Home, New cook, Wrap-up, Live cook, Cook detail, Cooks tab, sign-in, and the final logo (lockups in the `Logo` component, PWA icons and favicons). Added since the MVP: TempChart (sparse-friendly, wrap bands), Unwrap event, Delete cook, inline rating on Cook detail, Charcoal field, past cooks with only a date (`cooked_on`, `source: 'import'`, never live), staple-meat chips, and Cooks search/filters/sort in the URL. Tastings built end to end (one Tastings nav item; whisky, cigar, wine; list, form, detail, mixed Home Lately; choice fields like whisky Type, wine Type, cigar Strength; built so categories can be split out later). Everything (`/all`, Home's "See all") lists every cook and tasting with its own filters. Photos (detail heroes, cook mosaic, wrap-up, Live Photo button; not on list cards). Dawn/Dusk switch, rebuilt phone menu, one `$elevation` token, and the category wash on every entry card. Decisions are logged in `docs/design-system.md` (Decisions section). Not yet tested on a real phone.
- **Server facts (2026-11-18):** Ubuntu 24.04 LAMP droplet, Node v26.13.1 via NodeSource (upgraded from 22 on 2026-11-18; `baseball-watcher` verified healthy after), certbot certs per subdomain, `slowburn.gigantc.com` DNS resolves to the droplet. **Deployed 2026-11-19:** `/opt/slow-burn`, `slowburn` service user, systemd `slow-burn`, Apache proxy + certbot HTTPS, `build-essential` installed (better-sqlite3 compiles from source on Node 26). Production DB was seeded once from the dev DB (test entries included on purpose). No databases used by the other sites.
- **In progress:** nothing. dFree is re-entering old cooks as real data and reporting issues as they come up.
- **Next up:**
  1. Test on a real phone against https://slowburn.gigantc.com: photo capture and upload, offline queue, PWA install, safe areas, keyboard over forms, tap targets, wake lock, sticky bars.
  2. "Manage meats" (rename, merge, delete unused) in the menu.
  3. Confirm the nightly backup cron is in root's crontab (DB + photos), and consider DigitalOcean droplet backups for an off-box copy.
  4. Maybe: a unit-test setup (new dependency, dFree's call) for the pure helpers in `lib/` (`cookFilters`, `cookInfo`, `wrapSpans`, `rankStaples`).
  5. Cook detail stat tile still says "Final temp" (Wrap-up says "Final meat temp"); match it if dFree wants.
- **Dev DB note:** a running `npm run dev` re-applies migrations as files change, so stop it while the schema is being edited.
- **Data to re-enter:** The Dock's smoking and whisky notes are free-text Firestore entries (no structured fields). They'll be re-entered by hand as test data, which is why a cook with zero events and a past date is valid.
- **Decided:** no deadline (the Thanksgiving target was dropped on 2026-11-19). Rating is 5 stars (integer 1 to 5), the same for cooks and tastings. Temps are °F only. Sign out and the Dawn/Dusk theme switch live at the bottom of the desktop sidebar and in the Menu sheet on phone. Est. done is out for good (cook time can't be predicted). "None" is a real wood value (charcoal-only cooks); cards show charcoal, not wood.
