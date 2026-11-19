# Slow Burn design system

The spec for the redesign. The visual source of truth is the design canvas:
https://claude.ai/artifact/WvB2upNaVGdWnYCqPobF3E (row 1: phone, 390 wide; row 2: desktop, 1440 wide).
This file turns that canvas into tokens, components and rules. When the canvas and this file disagree, ask dFree.

---

## Direction

**A field journal at golden hour.** Warm paper grounds, a serif display face for names and big numbers, and plain sans for everything else. The Sonoran sky (sunrise in Dawn, sunset in Dusk) appears as a gradient in exactly two places: the desktop sidebar and the top of key phone screens. Everything else is flat color.

- Phone first, greasy hands: big targets, few fields per screen, one obvious primary action.
- **Next time** is the hero feature. It always gets the strongest treatment on the screen (tinted card, serif text).
- Desktop is for looking back: search, history, charts. Same components, more room.
- Every screen exists in **both** themes. The canvas shows each screen in one theme only (Dawn for daytime screens, Dusk for Live cook and Tasting); build both.

---

## Themes

Internal keys stay `light` / `dark`; labels are Dawn / Dusk (`THEME_LABELS`). Both palettes keep **identical keys** in `_variables.scss`. The Dawn values below match today's `$theme-light` where they overlap; **Dusk replaces the current "rough pass" `$theme-dark`** (plum grounds instead of navy; the navy survives in the sky gradient).

### Surfaces and text

| Role | Suggested key | Dawn | Dusk | Used for |
| --- | --- | --- | --- | --- |
| Page ground | `panel` | `#f4ecdc` | `#1c1520` | App background |
| Card | `card` | `#fbf6ec` | `#2a1f2e` | Cards, fields, list rows, tab bar (Dawn) |
| Raised | `raised` (new) | `#ebe0cb` | `#352839` | Event buttons, secondary buttons, chips |
| Sunken / track | `sunken` | `#ebe0cb` | `#43344a` | Progress tracks, photo placeholders, field ring (Dusk) |
| Alt panel | `panel-alt` (new) | `#fbf6ec` | `#241b28` | Desktop timeline column (Dusk) |
| Border / divider | `border` | `#e0d3ba` | `#352839` | 1px rules, input rings (Dawn) |
| Text | `text` | `#2e2340` | `#f6ead9` | Body and headings |
| Muted | `muted` | `#6b5f7a` | `#b9a9b8` | Labels, meta, timestamps |
| Muted on sky | `muted-sky` (new) | `#4f4360` | `#e6d9cc` | Secondary text sitting on a gradient (contrast) |
| Accent | `accent` | `#b83c16` | `#ff8a4c` | Primary buttons, links, active states |
| Accent hover | `accent-hover` (new) | `#8a2a0e` | `#ffc09a` | Link hover |
| Accent soft | `accent-soft` (new) | `#fde3d8` | `#ffb38a` | Dawn: active nav fill. Dusk: "On the pit" label, pit bar |
| On accent | `on-accent` | `#fffaf0` | `#1c1520` | Text on accent fills |
| Success | `success` (new) | `#4a6e1e` | `#a2bf6e` | Sync dot |
| Inverse surface | `inverse` (new) | `#2e2340` | `#2a1f2e` | Home "On the pit" card |
| Inverse text / muted | `inverse-text`, `inverse-muted` (new) | `#fbf6ec` / `#c9bccb` | `#f6ead9` / `#b9a9b8` | Text on the inverse card |
| Glass | `glass` (new) | `rgba(255, 255, 255, 0.07)` | same | Stat chips inside the inverse card |

Dusk link color in the canvas is `#ff9a63` (a touch lighter than accent for small text); fold it into `accent` if it reads fine at 16px.

### Next time callout

| Part | Dawn | Dusk |
| --- | --- | --- |
| Background | `#fde3d8` | `rgba(255, 138, 76, 0.10)` |
| Ring (editable version, Wrap-up) | `inset 0 0 0 2px #ec8a73` | `inset 0 0 0 1px rgba(255, 138, 76, 0.28)` |
| Eyebrow label + arrow icon | `#a52c10` | `#ffb38a` |
| Body text | `#5c1a08` | `#f1dccb` |
| Source line ("From your pork shoulder on Oct 12") | `#8a3b22` | `muted` |

### The Sonoran sky (gradients)

These are the existing `backdrop` values. They now have two jobs only.

| Where | Dawn (sunrise) | Dusk (sunset) |
| --- | --- | --- |
| Desktop sidebar | `linear-gradient(135deg, #f8d3a8 0%, #f1b09a 55%, #dcb0c4 100%)` | `linear-gradient(180deg, #232c47 0%, #2c3555 38%, #4d3d54 70%, #7a4538 100%)` |
| Phone sky (top of Home and Live cook) | `linear-gradient(180deg, #f8d3a8 0px, #f1b09a 150px, #e8c3c6 240px, #f4ecdc 360px)` | `linear-gradient(180deg, #232c47 0px, #2c3555 120px, #4d3d54 230px, #7a4538 330px, #1c1520 520px)` |

Rules:
- The phone sky is the page background of the screen, fading into `panel` by about 360px (Dawn) / 520px (Dusk). It is not a card or band; content scrolls over it. Make the sky a key so the stops can be tuned: `sky-sidebar`, `sky-phone`.
- Only Home and Live cook get the phone sky. Forms stay flat so fields read cleanly.
- Text on the sky uses `text` or `muted-sky`, never `muted` (it fails contrast on the coral and rust stops).
- Sidebar nav on the sky: active item `rgba(255, 250, 240, 0.6)` fill with `#8a2a0e` text (Dawn); `rgba(255, 245, 225, 0.12)` fill with accent text (Dusk). The sidebar's bottom block (sync, theme, sign out) uses `text` / `muted-sky`.

### Category colors

Each entry type owns one hue. Categories are data, so these live in **one Sass map keyed by category key** and get emitted as custom properties, the same way themes are.

| Category | Dawn ink | Dawn tint | Dusk accent | Dusk soft |
| --- | --- | --- | --- | --- |
| cook | `#a52c10` | `#fde3d8` | `#ff8a4c` | `rgba(255, 138, 76, 0.14)` |
| whisky | `#8f6200` | `#fff3c4` | `#f1c244` | `rgba(241, 194, 68, 0.16)` |
| cigar | `#4a6e1e` | `#ecf3d4` | `#a9cf7a` | `rgba(169, 207, 122, 0.16)` |
| wine (red wine: purple-red) | `#8a1f4a` | `#f6dde6` | `#d8638a` | `rgba(216, 99, 138, 0.16)` |

Wine moved from purple to red-wine. The old `wine` / `wine-tint` values and all `*-grad-a` / `*-grad-b` keys are not used by the new design.

**Tasting screens recolor by category.** Switching Whisky / Cigar / Wine swaps the screen's category accent; the rest of the palette stays. Elements that follow the category: Cancel link, category switch selected pill, photo button icon, note labels (Nose / Palate / Finish), lit rating stars (fill = soft, icon = accent), the Save button, and on desktop the active "Tastings" nav item and breadcrumb link. Suggested mechanism: `data-category="cigar"` on the tasting root sets `--cat`, `--cat-soft`, `--cat-on`; components use `v.$cat`, `v.$cat-soft`, `v.$cat-on`. In Dawn, solid fills use the Dawn ink with `on-accent` text.

Category tags (Home "Lately" lists): pill or square with category tint background and category ink text, uppercase 11 to 12px, weight 700.

---

## Logo

Final logo (canvas Logo page, "Logo set" row): the double flame with **SLOW BURN** in DM Sans 700, tracked 0.24em. No new font; the letters are outlined in the exported SVGs.

### Files

| File | Use |
| --- | --- |
| `src/client/components/Logo/logo-badge-on-dark.svg`, `-on-light.svg` | Stacked badge (flame, name, tagline). Sign-in screen, splash, About. |
| `src/client/components/Logo/logo-horizontal-on-dark.svg`, `-on-light.svg` | Flame + name on one line. Desktop sidebar, phone header, email. |
| `src/client/components/Logo/flame.svg` | The flame alone, full color. |
| `src/client/components/Logo/logo.svg` | The flame alone, one color (`currentColor`). |
| `public/icons/icon-192.png`, `icon-512.png` | PWA icons: flame on an ink tile with rounded corners. |
| `public/icons/maskable-512.png` | PWA maskable icon: full-bleed ink, flame inside the 80% safe circle. |
| `public/icons/apple-touch-icon.png` | iOS home screen (180, full bleed; iOS rounds the corners). |
| `public/icons/favicon.svg`, `favicon-32.png` | Browser tab: the flame alone, no tile. |

For the in-app sidebar and header, build the lockup in the `Logo` component (inline SVG, so the name can follow the theme's `text` color) rather than switching between the on-light and on-dark files. Path data can be copied from the SVGs.

### Proportions (in units of the name's font size, em)

- **Badge:** flame 2.47em tall, centered above the name; 0.3em gaps; tagline "SMOKE · SIP · SAVOR · REPEAT" at 0.3em, DM Sans 600, tracked 0.3em.
- **Horizontal:** flame 2.41em tall, vertically **centered** on the name (not on the baseline), 0.7em gap.
- **Flame shape:** width = 0.575 x height (viewBox `55 6 145 252`), gradient bottom `#d54d24` to tip `#f5a623`.
- **Icon tiles:** flame about 70% of the tile height on ink `#2e2340`.

### Color

| On | Name | Tagline |
| --- | --- | --- |
| Dark / ink / Dusk sky | `#fbf6ec` | `#ffb38a` |
| Light / cream / Dawn sky | `#2e2340` | `#a52c10` |

One-color uses (stamps, mask icons): flame in ember `#b83c16`, ink or cream; never recolor the gradient.

### Rules

- **Clear space:** one cap height of SLOW BURN on every side.
- **Minimum sizes:** badge 200px wide with the tagline, smaller drops the tagline; horizontal name 13px or larger; flame alone 12px tall or larger.
- Don't stretch, re-space, or set the name in another weight or face.

---

## Typography

Fonts are already self-hosted: **Fraunces** (`$font-display`) and **DM Sans** (`$font-body`). No other faces.

| Style | Font | Phone | Desktop | Weight / tracking | Where |
| --- | --- | --- | --- | --- | --- |
| Display (h1) | Fraunces | 34px / 1.1 | 44px / 1.05 | 600, -0.02em | Screen titles ("New cook", "Pork shoulder") |
| Section (h2) | Fraunces | 20px | 22 to 24px | 600 | "Lately", "Timeline", "Notes" |
| Card title (h3) | Fraunces | 20 to 26px | 20 to 32px | 600 | Live card meat, Lately card names, meat picker value |
| Next time body | Fraunces | 18 to 19px / 1.35 | 20 to 21px | 500 | The note itself |
| Clock | Fraunces | 80px / 0.9 | 52px / 1 | 500, -0.03em, tabular | Live elapsed time |
| Stat value | DM Sans | 22px | 26 to 28px | 600, tabular | Stat and number-field values |
| Temp value | DM Sans | 34px | 44px | 600, tabular | Live pit / meat |
| Body | DM Sans | 16px / 1.4 to 1.5 | 16 to 17px / 1.6 | 400 | Notes, prep |
| Button | DM Sans | 17 to 18px | 15 to 16px | 600 (700 on Dusk accent fills) | |
| Label | DM Sans | 13px | 13px | 400, `muted` | Field labels |
| Eyebrow | DM Sans | 12 to 13px | 12 to 13px | 700, uppercase, 0.06 to 0.08em | "NEXT TIME", "ON THE PIT", "RATING" |
| Meta | DM Sans | 13 to 14px | 14 to 15px | 400, `muted` | Dates, weights, wood |

- Per global rules, typography is set by element in `_base.scss`; pick heading levels to match rather than overriding `font` in components. Desktop sizes come from the breakpoint inside `_base.scss`.
- All numbers that update or line up (temps, times, weights, stats, timeline times) use `font-variant-numeric: tabular-nums`. Remember the minifier gotcha in CLAUDE.md: put it in a separate rule from any `font` shorthand.
- Sizes above are px at a 10px root; convert to rem.

---

## Space, shape, depth

- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48. The canvas has some 10/14/18/22 values; snap them to the nearest step.
- **Page padding:** phone 20px sides; desktop content 40px top, 48px sides, content `max-width: 1100px` centered.
- **Radii:** 12 (nav items, chips, segment pills), 16 (fields, stat tiles, desktop buttons), 18 (phone primary buttons, event buttons), 20 to 24 (cards, callouts, the live card), 999 (pills, status chip).
- **Shadows:** card `0 6px 20px rgba(90, 40, 60, 0.08)` (Dawn only; Dusk cards are flat); inverse live card `0 10px 30px rgba(46, 35, 64, 0.25)`. Fields use an inset 1px ring in `border`, not a border.
- **States** (global rule: never change border-width, padding or font-weight): hover darkens/lightens fill or uses `hover` token; `:focus-visible` is an inset 2px ring in accent (or `--cat` on tasting screens); selected uses fill + ring, as the meat picker does (`inset 0 0 0 2px accent`).

### Touch targets

- Minimum 44px for anything tappable.
- Phone primary actions (Start cook, Save cook, Save tasting, Off the pit): 60 to 64px tall.
- Live event buttons: 92px tall phone (3 per row), 84px desktop (auto-fill, min 130px).
- Rating stars: five separate buttons, 56 to 60px tall, the full width on phone.

---

## Layout

### Phone

- Single column. Bottom **tab bar**: Home, Cooks, Tastings, Menu (icon over label, 12px, active = accent).
- Forms (New cook, Wrap-up, Tasting) have a **sticky footer action bar** with a top hairline. The scroll container needs bottom padding equal to the bar height (this is the existing overlap bug; fix it in the shared form layout).
- Back / Cancel lives top left as a text link (44px tall). No close "X" buttons.

### Desktop

- Two-part shell: **sidebar** (`flex: 1 1 220px`, sky gradient, no border) + **content** (`flex: 999 1 560px; min-width: 0`). The parent row wraps, so on narrow windows the sidebar stacks on top instead of squeezing.
- Sidebar, top to bottom: horizontal logo lockup (see Logo), **New cook** primary button, nav (Home, Cooks, Tastings), spacer, sync status, Theme toggle (shows Dawn / Dusk), Sign out. This replaces the menu popover on desktop.
- Content header: breadcrumb (14px muted, parent is a link), then the h1. Optional right-side control (search on Home, category switch on Tasting, Edit on Detail).
- Two-column screens are a wrapping flex row: main `flex: 2 to 3 1 ~500px`, aside `flex: 1 to 2 1 ~300px`, 32px gap.
- Desktop forms do **not** use the sticky bar: actions sit inline, right-aligned, under the form (Cancel secondary + primary).

The phone-to-desktop switch (tab bar vs sidebar) happens at the existing `$bp-md`; don't invent a new breakpoint.

---

## Components

Build these once and reuse them. Names are suggestions; check `src/client/components/` first and extend what exists (Button, Card, Field, MeatPicker, RatingInput, Stars, SyncStatus, Nav, AppShell, Summary, EntryHead...).

| Component | Notes |
| --- | --- |
| **AppShell** | Phone: content + TabBar. Desktop: Sidebar + content. Owns the sky backgrounds (prop or route flag for `sky`). |
| **Sidebar** | See layout. Active item per route. |
| **TabBar** | 4 items, safe-area bottom padding. |
| **Button** | Variants: `primary` (accent fill), `secondary` (raised fill), `category` (uses `--cat`). Optional leading icon. Sizes: `lg` (60 to 64px, phone actions), `md` (48 to 52px). Links styled as buttons stay `<a>`. |
| **Field** | Card-style field: label (13px muted) above the input, fill `card`, inset ring. Variants: `number` (big 26 to 28px tabular value + unit suffix like `lb`, `°F`), `text`, `textarea`. Inputs have no border of their own. |
| **MeatPicker** | Selected value as a big Fraunces button with a chevron and accent ring; recent meats as chips below; last chip "+ New meat". |
| **Chip** | Pill, `raised` fill, 40 to 44px tall. |
| **NextTime** | Variants: `card` (New cook, Detail), `strip` (Live: one line, arrow icon, bold "Next time:" lead-in), `field` (Wrap-up: editable textarea with ring and the hint "Shown first when you start your next pork shoulder."). Uses the category name of the meat in copy. |
| **LiveCookCard** | Home only. Inverse surface, "On the pit" eyebrow with pulsing dot, meat name, elapsed, pit and meat chips. Whole card is a link to the live cook. Hidden when nothing is cooking. |
| **StatTile** | Label + tabular value. Used for Total time, Final temp, Rested, Avg pit. |
| **TempTile** | Label, big value, "/ target" in muted, 6px progress bar (track `sunken`, fill accent / accent-soft). Pit bar = value / target; meat bar = progress from start temp to target. |
| **EventGrid** | Buttons generated from `src/shared/cookEventTypes.ts` (still data, not code). Icon (accent stroke) over label. "Off the pit" is the accent-filled terminal action: full-width row on phone, last grid cell on desktop. |
| **Timeline** | `<ol>`, newest first. Columns: time (tabular, muted), dot (color by event kind on Live), label, value. 44 to 48px rows with a hairline. |
| **TempChart** | Inline SVG, two polylines (pit = muted, meat = accent), dashed wrap marker, dashed target line on Live, start and end time labels, legend in the caption. `role="img"` with a written summary as `aria-label`. Fluid width. Data from `pit_temp` and `internal_temp` events. |
| **RatingInput** | Five star buttons, `aria-pressed`, lit = tint fill + accent icon. Display-only stars elsewhere stay the `Stars` component (★ characters, accent color, `aria-label="4 of 5 stars"`). |
| **CategorySwitch** | Segmented `radiogroup`, 3 equal pills; selected pill = category accent fill with `on` text. |
| **CategoryTag** | See Category colors. |
| **PhotoGrid / PhotoDrop** | Square tiles, `sunken` placeholders, an "add" tile with a dashed-feel ring (`inset 0 0 0 2px border`) and plus icon. Desktop: drag and drop hint text. |
| **SearchField** | Desktop Home header. Icon + input on a card-style pill, 48px. |
| **SyncStatus** | Dot (`success`) + "Synced". Other states keep their existing copy. |

Icons: inline stroke SVGs, 2px stroke, `currentColor`, `aria-hidden="true"`; icon-only buttons get `aria-label`. The canvas uses simple placeholder icons; swap for the project's `Icon` set if it has equivalents.

---

## Screens

| Screen | Phone | Desktop | Notes |
| --- | --- | --- | --- |
| Home | Sky header, greeting ("Thursday evening" + "What's on the fire?"), LiveCookCard, two big tiles (Start a cook, Log a tasting), "Lately" list, tab bar | Search in header, wide LiveCookCard, 3-column "Lately" card grid | Greeting time-of-day line is computed. |
| New cook | Meat picker, Next time card right under it, 2x2 number fields (Weight, Target meat, Target pit, Start time), Wood, Prep, sticky Cancel / Start cook | Form left; aside with Next time + "Past pork shoulders" list | Next time and past list appear only once a meat with history is picked. |
| Live cook | Sky, header with back + "On the pit" chip, meat + meta, big clock, Est. done, TempTiles, Next time strip, EventGrid, Off the pit, Timeline | Stat row (Elapsed, Pit, Meat), live TempChart, Next time strip, EventGrid, Timeline in a right column | |
| Wrap-up | "How'd it go?", stat row, RatingInput, Notes, Next time field, Photos, sticky Save cook | Form left, photos right, inline actions | |
| Cook detail | Photo hero with floating back/edit, eyebrow (Cook · date), title, stars + meta, stat row, Next time card, TempChart, Notes, Timeline | Header with Edit, photo mosaic, wide chart, notes; aside with 2x2 stats, Next time, Timeline | |
| Tasting | Category switch, photo button + Name + Maker, three category spec fields, RatingInput, three category note fields, sticky Save tasting | Big photo drop left, form right, four spec fields (adds Date), category switch in header | See per-category fields below. |

**New in the design, not in the brief.** Confirm before building: Est. done (Live), Rested (Wrap-up/Detail stat), Avg pit (Detail stat), Start time field (New cook), the past-cooks list (New cook desktop), search (desktop Home).

### Tasting fields per category

Shared: name, maker, date, photo, rating. Category fields (as data, with the category definition):

| Category | Spec fields | Note fields | Photo label |
| --- | --- | --- | --- |
| Whisky | Age, ABV, Region | Nose, Palate, Finish | Add a photo of the bottle |
| Cigar | Vitola, Wrapper, Smoke (time) | Draw, Flavor, Finish | Add a photo of the band |
| Wine | Vintage, Varietal, Region | Nose, Palate, Finish | Add a photo of the label |

---

## Decisions (2026-11-19)

- **Typography and token scale follow this doc and the canvas.** The old base styles were a wireframe; h1 is Fraunces now.
- **Greeting line** ("Thursday evening") is computed from local time. Best-guess boundaries, tune later: morning 5:00 to 11:59, afternoon 12:00 to 16:59, evening 17:00 to 20:59, night 21:00 to 4:59. Boundaries live in client config.
- **Desktop search on Home:** left out for now.
- **"Log a tasting"** links to the existing Tastings placeholder route until tastings are built. Whether whisky, cigar and wine stay under one Tastings item or become separate nav items is undecided.
- **Phone Menu sheet** is not designed: restyle the existing menu with the new tokens. Expect it to change.
- **Undesigned states** (no live cook, empty Lately, loading, sync pending/offline/error) are designed on the fly from these tokens and components, built to be easy to change.

## Copy

- UI copy in the canvas is final unless dFree changes it. Use it verbatim.
- No em dashes in UI strings.
- Sample data in the canvas (Lagavulin 16, pork shoulder times, the prep note naming a rub brand) is placeholder content, not copy.

## Accessibility checklist

- Real `<button>` / `<a>` everywhere; the category switch is `role="radiogroup"` with `role="radio"` + `aria-checked`.
- Rating buttons use `aria-pressed` and labels like "4 stars".
- Text contrast 4.5:1 minimum. That's why `muted-sky` exists: `muted` fails on the gradients.
- Category colors also differ in lightness, not hue alone; tags always carry a text label.
- Visible `:focus-visible` ring on every interactive element.
- Respect `prefers-reduced-motion` for the live dot pulse and any transitions.
