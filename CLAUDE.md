# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Personal portfolio website for Shravan Chandra, Machine Learning Engineer (Production ML & Applied GenAI). Single-page application: hero with hiring snapshot, three-project overview, experience line map, three case studies, research, ASL demo.

**Deployment target:** GitHub Pages (`shravnchandr.github.io`), auto-deploys on push to `master`.

---

## Running Locally

```bash
# Use a local server — direct file:// access breaks ES modules (CORS) and fetch()
python3 -m http.server
# Visit http://localhost:8000
```

---

## Architecture

**Fully static site** — no build tools, bundlers, package managers, or compilation step. Edit files and refresh the browser.

The site uses an **NYC Subway signage** design (after the 1970 NYCTA Graphics Standards Manual): black station signs with a thin white rule, Helvetica, coloured route bullets, and a line map for the career. See *CSS Design System* below for the rules. All styles are under `css/`, all HTML fragments in `html/`, all JS in `js/`. The old `script.js` (single-file) has been replaced by ES modules.

### File Map

```
Root keeps only what must live there: the pages, files crawlers/browsers request
by fixed name, and the public résumé URL (already shared — never move it).

index.html                  # Shell: head, icon sprite, skeleton screens, persistent UI
404.html                    # Service-notice 404 page (GitHub Pages serves it for missing paths)
robots.txt · sitemap.xml    # Crawl rules + URL index
favicon.ico · favicon.svg · apple-touch-icon.png   # Icons (crawlers request /favicon.ico directly)
Shravan_Chandra_Resume.pdf  # Downloadable résumé — public URL, keep at root

assets/img/
  memoji-128.jpg            # Logo avatar (nav, 404, social card, LinkedIn thumbnails)
  social-card.jpg           # 1200×630 link-preview card (og:image / twitter:image); source dev/social-card.html
  link_preview.jpg          # Square headshot, 800px (JSON-LD image; source photo for the card)

js/
  loader.js                 # Plain <script>: fetches html/*.html fragments in parallel, sets __sectionsReady
  main.js                   # ES module entry point — imports the other js/* modules and boots the app
  asl_model.js              # Trained MLP weights + StandardScaler; loaded lazily by webcam.js (<script>, path relative to the page)
                            #   Defines ASL_MODEL_DATA and ASL_SCALER_DATA; weights stored TRANSPOSED [in][out]
  utils.js                  # Shared DOM helpers: el(), makeOverlay(), makeTop3Row(), updateLetterDisplay()
  theme.js                  # Theme toggle; follows OS by default (localStorage 'theme-v2' = explicit choice)
  nav.js                    # Mobile hamburger + active-section highlight + logo Easter egg
  scroll.js                 # Scroll-reveal, CountUp, back-to-top, smooth scroll
  asl.js                    # Procedural SVG ASL hand; random cycle + spellSequence() override
  demo.js                   # Scripted ASL pipeline demo (HELLO WORLD → grammar → output)
  a11y.js                   # Accessibility Lab toggle + side panel (ARIA overlays)
  search.js                 # ⌘K semantic search overlay — keyword index, keyboard nav
  webcam.js                 # Live webcam ASL classifier: MediaPipe Hands + MLP inference
  layout.js                 # Moves the hero's ASL demo card below the project overview on single-column layouts

html/
  nav.html                  # <nav>: logo (memoji avatar + "Shravan Chandra"), links with section bullets, search, theme, a11y btn, hire-me
  hero.html                 # Hero: headline, live ASL recognition CTA, ASL card
  impact.html               # At a glance: 3 project tiles (result + one-line ownership) linking to the case studies, + #overview-demo-slot  (01 · AT A GLANCE)
  story.html                # Experience line map (UBC now → Bosch roles → Goldman) + earlier education  (02 · EXPERIENCE)
  work.html                 # 3 case studies: maintenance, Valfred, ASL Guide (+ Architecture Trace)  (03 · SELECTED WORK)
  research.html             # Research & Publications: 4 sign-language papers + Retinopathy  (04 · RESEARCH · PUBLICATIONS)
  demo.html                 # Live Demo section: scripted ASL Guide pipeline replay  (05 · LIVE DEMO)
  stack.html                # 5-column skills grid  (06 · STACK)
  now.html                  # "What I'm on" + OSS contributions  (07 · NOW)
  contact.html              # One large "Next Stop" sign: h2, 3 CTA buttons, accessibility line  (08 · NEXT STOP)

css/
  main.css                  # @import entry point — no legacy layers
  variables.css             # All design tokens: page palette (dark + light), sign colours, route colours (--r-*)
  base.css                  # body/reset rules, focus ring, .v2-section, section-header signs, .v2-modal-overlay, .v2-panel-close, FOUC guard
  signage.css               # Route bullets (.v2-bullet[data-r]), .v2-sign, .v2-line-card, .v2-legend, .v2-card-badge, .v2-access
  skeleton.css              # Shimmer screens for nav/hero/impact/below-fold (visibility override trick)
  nav.css                   # .v2-nav sticky + mobile responsive
  hero.css                  # Hero layout, ASL card, status badge, wavy underline SVG
  impact.css                # At-a-glance project tiles
  demo.css                  # Live demo section: webcam panel, pipeline panel, log
  story.css                 # Experience line map (stripes + stations), earlier education
  cards.css                 # .v2-panel-chrome, buttons (.v2-btn-*), case-study facts + summary, key-result rows, Architecture Trace
  research.css              # Research section: featured card, 2-col row, bullet list
  stack.css                 # 5-col route tiles, one per skill category
  now.css                   # Now + OSS cards
  contact.css               # Contact section gradient bg + icon sizing
  a11y.css                  # Accessibility Lab toggle btn, side panel, ARIA highlight overlays
  search.css                # ⌘K overlay, modal, results list, nav trigger btn
  webcam.css                # Webcam video overlay, toggle button (.v2-webcam-*), status dot
  animations.css            # Spring keyframes, [data-m3-press], [data-hover-lift],
                            #   .animate-in, .stagger-2–5 — LOADED LAST

dev/
  social-card.html          # Source of assets/img/social-card.jpg
  export_model.py           # PyTorch → JSON export (weights for js/asl_model.js; gitignored)
  linkedin-banner.html      # LinkedIn banner source (gitignored)
```

---

## How the Page Loads

```
index.html parsed
  │
  ├─ js/loader.js (plain <script>, runs immediately)
  │    └─ bootstrap() — fetch html/*.html in parallel (6s timeout per attempt, 3 retries)
  │         └─ each placeholder <div id="frag-*"> replaced by outerHTML of fetched fragment
  │         └─ window.__fragments = { critical, all }  (promises; never reject)
  │         └─ critical (nav + hero) settled → body.classList.remove('loading')  ← FOUC guard
  │
  └─ js/main.js (type="module", deferred by default)
       └─ __fragments.critical → initCore()     (theme, nav, back-to-top, skip link, ASL, a11y, search, webcam)
          __fragments.all      → initSections() (active nav, scroll reveal, CountUp, demo, demo-card placement) → markSectionsReady()
```

Below-fold placeholders keep showing skeletons until their own fetch settles, so a stalled section never blocks the hero.

`body.loading { visibility: hidden }` (in `css/base.css`) prevents any flash while fragments are being fetched.

---

## Page Structure

Sections load in this order (matching `js/loader.js` FRAGMENTS array):

| # | Fragment | Section id | Description |
|---|---|---|---|
| 1 | nav.html | — | Sticky nav |
| 2 | hero.html | — | Headline + ASL demo card |
| 3 | impact.html | `#overview` | Three project tiles (01 · AT A GLANCE) |
| 4 | story.html | `#story` | Experience line map (02 · EXPERIENCE) |
| 5 | work.html | `#work` | Case studies (03 · SELECTED WORK) |
| 6 | research.html | `#research` | Research & Publications (04 · RESEARCH) |
| 7 | demo.html | `#demo` | Live ASL pipeline demo (05 · LIVE DEMO) |
| 8 | stack.html | `#stack` | Skills grid (06 · STACK) |
| 9 | now.html | `#now` | Now + OSS (07 · NOW) |
| 10 | contact.html | `#contact` | Contact (08 · NEXT STOP) |

### Hero hiring snapshot
Under the name, `.v2-hero-routes` lists the specialties as route bullets (M Production ML · G Applied GenAI · A Accessible AI), matching the banner and social card. The name stays on one line from 390px (`clamp(48px, 6vw, 84px)`, `nowrap` above phones).
`<dl class="v2-glance v2-sign">` under the hero, an information board: based in / looking for (target roles + availability) / work authorization / strengths. Keep it in sync with `now.html`, `contact.html`, the UBC stop in `story.html` and the meta tags.

### Selected work (`#work`)
`<article class="v2-case">` per case study: `#case-maintenance`, `#case-valfred`, `#case-asl-guide`. (Retinopathy lives in Research as `#research-retinopathy`.)
Each opens with a one-sentence `<p class="v2-case-summary">` (what I owned + the result), then a `<dl class="v2-case-facts">` (Problem / What I owned / Result / Key decision / How it's measured). The `#overview` tiles link here.

### Experience (`#story`)
`<ol class="v2-timeline">` drawn as a line map, with `#role-ubc` (current stop, "Now"), `#role-bosch-sr`, `#role-bosch-ml`, `#role-bosch-swe`, `#role-goldman`. Lines: M Production ML (blue), G Applied GenAI (purple), D Data infrastructure (orange), S Software (green); track columns M 0 · G 1 · D 2 · S 3. The key also lists A Accessible AI & sign language (yellow: ASL Guide, sign-language research) and R Research & coursework (teal `#00a1de`, distinct from S green: retinopathy, PES and the student projects on LinkedIn) — neither has a track column. In Stack, Languages uses a grey **L** (the L train's colour) so it doesn't share Infrastructure's green S. **M is only for production ML**; academic and student work uses R. The same meanings apply to the LinkedIn thumbnails, where a card's badge and its coloured bar always match.
Each stop has a `.v2-tl-station` spanning the columns it serves (`--from`/`--to`) and a `.v2-tl-stripe` (`--i`) for each line shared with the **next** stop — update both when roles change. The senior role shows an outcome + 3 short bullets, with the full versions in `<details class="v2-tl-more">`; earlier roles show only the outcome. Bullets lead with the result in `<strong>`. `#education` holds earlier education (PES).

### Responsive demo placement
On single-column layouts (≤1024px) `js/layout.js` moves `.v2-hero-right` (the ASL demo card) into `#overview-demo-slot`, after the three project tiles, and back when the layout widens; `hero.css` hides it inside the hero at that width so it never flashes there first.

### Easter eggs (opt-in only — nothing triggers on its own, moves the layout or plays sound)
- **Fingerspell H-I** in "Try live" (`js/webcam.js`, `SECRET`): two letters that hold steady (the same ones announced to screen readers) within 6s show a small "Next stop: a conversation" sign over the canvas, with the email. The hint "psst — try signing H-I" appears only once the camera runs.
- **404 page** (`404.html`, root): a service notice with the line map back to each section. Self-contained (inline CSS, absolute links) because GitHub Pages serves it for any missing path.
- **Console note** in `js/main.js` for engineers who open DevTools.

### Draft placeholders
`<span class="v2-todo">TODO: …</span>` marks facts still to be supplied (styled as dashed orange chips). `grep -rn v2-todo html/` must return nothing before publishing.

---

## JavaScript Architecture

All modules use ES module syntax (`export function init*()`).

### `js/main.js` (entry point)
```js
import { initTheme }    from './theme.js';
import { initNav }      from './nav.js';
import { initScroll }   from './scroll.js';
import { initASL }      from './asl.js';
import { initDemo }     from './demo.js';
import { initA11yLab }  from './a11y.js';
import { initSearch }   from './search.js';
import { initWebcam }   from './webcam.js';

function initApp() { /* calls all inits + console Easter egg */ }

if (window.__sectionsReady) initApp();
else window.__onSectionsReady = initApp;
```

### `js/utils.js`
Shared DOM/UI helpers imported by `a11y.js`, `search.js`, `asl.js`, `webcam.js`, `scroll.js`, `nav.js`, `demo.js`.

- `el(tag, cls, attrs)` — creates an element, sets className, applies attr key/value pairs
- `makeOverlay(extraClass, ariaLabel)` — builds the standard modal overlay div with `role="dialog"`, `aria-modal`, `aria-hidden`; base styles from `.v2-modal-overlay` in `css/base.css`
- `makeTop3Row(rank, letter, pct, isTop)` — builds a `.v2-t3-row` confidence bar row (label + fill bar)
- `updateLetterDisplay(letterEl, key, prevKey)` — swaps letter text and re-triggers `m3LetterPop` animation via reflow
- `createModal(overlay, openClass)` — APG modal behaviour: inerts the rest of `<body>`, traps Tab, Escape closes, restores focus; one modal at a time (`isModalOpen()`)
- `renderTop3(container, rows)` — renders Top-3 rows, reusing existing nodes
- `prefersReducedMotion()` / `scrollToEl(el)` — motion-aware helpers
- `clearEl(element)` — removes all child nodes from a DOM element; replaces the repeated `while (el.firstChild) el.removeChild(el.firstChild)` idiom
- `routeFor(key)` — subway route colour for a sign key (the site's own lines first — M blue, G purple, D orange, S green, A yellow, R teal — then MTA colours for other letters, e.g. C/E blue, N/Q/W yellow, L grey; no route → `none`). `updateLetterDisplay` sets it as `data-r`, so the prediction letter is a route bullet; `demo.js` does the same for its overlay letter

### `js/asl.js`
Exports `initASL`, `SIGNS`, `CONNECTIONS`, `spellSequence`, `pauseASL`, `resumeASL`, `drawHandPose`.

- `SPEC`: 36-entry dict mapping sign keys → `[thumbState, idx, mid, rng, pnk]` finger states (module-internal, not exported)
- `SIGNS`: 36 ASL poses (A–Z + 0–9), each a 21-point array `[[x,y], …]` (procedural rendering geometry built from SPEC via `buildPose`)
- `CONNECTIONS`: 21 MediaPipe-style connection pairs for drawing the skeleton
- `buildPose(thumb, index, middle, ring, pinky)`: composes pose from per-finger states
- State machine: **hold** 1100ms → **morph** 420ms, lerped with `easeIO`
- `updatePanel(key, conf)`: re-triggers `m3LetterPop` CSS animation on letter change
- Single RAF loop, runs only when not paused (webcam), visible (`document.hidden`) and on-screen (IntersectionObserver)
- Reduced motion: SVG infrastructure + `drawHandPose` still built; a static pose is shown instead of the cycle
- `spellSequence(letters, onDone?)`: module-level override — sets `_seqQueue`; on the next `tick()` frame the state machine hijacks to the sequence at 2× speed (hold 550ms / morph 280ms) then resumes random cycle. Silently ignored if a sequence is already playing.
- `pauseASL()` / `resumeASL()` / `drawHandPose(pose)` / `hideHandPose()`: refs wired inside `initASL`; called by `webcam.js` to pause the random cycle and draw live MediaPipe landmarks instead.

### `js/nav.js`
- `initMobileMenu`: hamburger toggle, close on link click or outside click. Compact menu at ≤1240px (`MOBILE_MQ`, matching `css/nav.css`): measured, the full link row needs ~1330px and the tightened one (1241–1339px) ~1220px — re-measure if links change
- `initActiveNav`: IntersectionObserver highlights the active nav link
- `initLogoEasterEgg`: clicking `.v2-logo` calls `spellSequence(['S','H','R','A','V','A','N'])` and smooth-scrolls to top; `preventDefault` suppresses the `href="/"` reload

### `js/a11y.js`
- `initA11yLab()` — wires `#a11y-lab-btn` (nav) and `#a11y-panel` (persistent aside in index.html)
- `_buildPanel(panel)` — constructs side panel via pure DOM manipulation (no innerHTML): header + close button, colour legend, 6 feature rows
- `setActive(on)` — toggles `body.a11y-lab`, `aria-pressed`, `.v2-a11y-panel--open`, `aria-hidden`; persists to `localStorage` key `a11y-lab`
- `body.a11y-lab` activates CSS outline overlays in `css/a11y.css`: orange dashes on landmarks, teal on `aria-label` elements, purple on `aria-live` regions

### `js/search.js`
- `initSearch()` — builds the search overlay via DOM, binds `⌘K`/`Ctrl+K`, wires `#search-trigger` in the nav
- `INDEX`: 14 entries (4 projects/case studies + 4 research + 4 experience + 2 education), each with `tokens[]`, `label`, `sub`, `route` (`[letter, colour]`, shown as a route bullet in results), `action()`. The UBC entry jumps to `#role-ubc`, PES to `#education`
- `_query(raw)` — tokenises query (strips stop words, normalises), scores against `INDEX`:
  - Exact match: `+5` (len ≥ 5), `+3` (len ≥ 3), `+1` (short)
  - Prefix match (query is prefix of token, len ≥ 3): `+2`
  - Substring match (query inside token, len ≥ 3): `+1`
  - A trailing plural `s` is also tried (`projects` → `project`)
  - Every entry carries section words (`project`/`work`, `research`/`paper`, `experience`/`job`, `education`) so category queries return the whole group
  - **No `w.includes(t)` direction** — avoids false positives (e.g. token `"ecu"` inside query `"because"`)
- Results grouped into Projects / Experience & Education; keyboard nav (↑↓ Enter Escape)
- `action()` on project/experience entries and research entries call `_reveal(selector)`: waits for `sectionsReady`, expands a collapsed timeline entry, scrolls to the target

### `js/demo.js`
Imports `SIGNS`, `CONNECTIONS` from `./asl.js`.

- Scripted sequence: `H E L L O · W O R L D`
- Updates `#demo-asl-svg`, `#demo-buffer`, `#demo-grammar`, `#demo-output`, `#demo-log`
- Fires when `#demo` section scrolls into view (IntersectionObserver, threshold 0.25)
- `#demo-replay-btn` resets and reruns
- No innerHTML — all DOM updates via `createElement` / `textContent` / `appendChild`

### `js/webcam.js`
- `initWebcam()` — wires `#webcam-toggle`, hides button if `getUserMedia` unavailable
- On button click: loads `js/asl_model.js` and `@mediapipe/hands` CDN **in parallel** via `_loadScript`, then initialises MediaPipe Hands and starts `getUserMedia`
- `_classify(worldLandmarks)` — runs the MLP forward pass:
  1. Flatten 21 × `{x,y,z}` world landmarks → 63 floats
  2. StandardScaler: `(val − mean[i]) / scale[i]` (from `ASL_MODEL_DATA.scaler`)
  3. Forward: `_matMul` (transposed weights `[in][out]`) + ReLU × 2, then logits
  4. Softmax → top-3 `{key, conf}` (keys: A–Z, DEL, SPC)
- `_matMul(input, W, bias)` — correct transposed-weight multiply: `out[j] = Σ_i(input[i] × W[i][j]) + bias[j]`
- `_onResults` uses `multiHandLandmarks[0]` for SVG drawing (`drawHandPose`) and `multiHandWorldLandmarks[0]` for MLP inference
- **Critical**: `js/asl_model.js` weights are transposed (`[in_features][out_features]`) — `_matMul` must iterate outer index over `in` and inner index over `out`, NOT the reverse (the original pre-v2 script had this swapped)

### `js/scroll.js`
- `initScrollReveal`: adds `.show` to `.animate-on-scroll` on intersection (threshold 0.12)
- `initCountUp`: parses `.v2-metric-val` text (e.g. `€300K+`) and counts up on intersection. Nothing uses it at the moment: the overview tiles and the experience line deliberately have no count-up or scroll reveal, so they're complete on first paint for quick scanning
- `initBackToTop`: shows `#back-to-top` after 300px scroll
- `initSkipLink`: in-page links use native fragment navigation (smooth via CSS `scroll-behavior`); the skip link also focuses `<main>`

---

## CSS Design System

### Subway signage rules
Based on the 1970 NYCTA Graphics Standards Manual (Vignelli/Noorda, Unimark). Keep to these when adding anything:
- **Colour = route.** Accent colours appear only on route bullets and lines (`--r-*`); text, numbers and links stay black/white. Cards carry their route via `data-r` on a `.v2-line-card` (6px line on top).
- **Signs are black in both themes** (`.v2-sign`: `--sign-bg`, white text, thin white rule near the top), kept for focal points: the hero availability badge, the hiring snapshot, the ASL card strips and canvas, earlier education, contact. Section headers are lighter **route strips**: a 6px rule in the section's colour (`data-r` on the header) above the bullet + name. Content cards are `.v2-line-card`.
- **One sans:** the Helvetica stack (`--font-sign`). Sign names are Medium (500), bullets Bold (700), as in the manual. Fira Code (`--font-mono`) only for code, logs and live data.
- **Circles are reserved for route bullets**; everything else is a rectangle (`--radius: 4px`). Work in progress is labelled in words ("In progress"), not with a different bullet shape.
- **No gradients, glows or tinted shadows.**
- Sections and their routes: 1 At a Glance (red) · 2 Experience (blue) · 3 Selected Work (orange) · 4 Research (purple) · 5 Pipeline Replay (yellow) · 6 Stack (green) · 7 Now (brown) · 8 Next Stop (grey). Nav links carry the same bullets.
- Bullet letters reach ≥4.5:1 on their fill. On the light theme, bullets and lines get a thin outline, because yellow and lime are under 3:1 on white.

Section header markup:
```html
<div class="v2-section-header" data-r="blue">
    <div class="v2-section-name"><span class="v2-bullet" data-r="blue" aria-hidden="true">2</span>Experience</div>
    <div class="v2-section-meta">short summary</div>
</div>
```

### Theme (follows OS by default)
`:root` in `css/variables.css` defines the dark palette; `body.light-theme` overrides it ("the map": white ground, signs stay black). With no saved choice the page follows `prefers-color-scheme`; an inline script at the top of `<body>` in `index.html` applies the class before first paint, and `js/theme.js` wires the toggle and live OS changes. Choosing the OS's own theme clears the saved key. Theme key in localStorage is `theme-v2` (the old key `theme` drove the legacy dark-theme/light-theme class system — do not reuse it).

### Tokens (in `css/variables.css`)
```css
--v2-bg / --v2-surface / --v2-surface-hi / --v2-surface-hi2 / --v2-border   /* page surfaces */
--v2-text / --v2-text-dim / --v2-text-muted                                 /* text; muted ≥4.8:1 everywhere */
--v2-neural / --v2-data / --v2-inference   /* text-safe purple / green / orange, for rare meaningful colour */
--sign-bg / --sign-text / --sign-dim / --sign-rule                           /* signs, same in both themes */
--r-blue … --r-none, each with --r-*-on                                     /* route fills + letter colour */
--font-sign / --font-mono / --radius / --v2-focus
```
`[data-r="blue"]` etc. (in `signage.css`) expose a route as `--c` / `--on` to the element and its children. Components read them with a fallback (`var(--c, …)`) — never set `--c` as a default on a class, or it will beat `[data-r]` on the same element.

### Motion (`css/animations.css`)
- `[data-m3-press]` — spring press-state on buttons (scale 0.94 on active, bounce back)
- `[data-hover-lift]` — cards translateY(-3px) with spring easing on hover
- `m3LetterPop` keyframe — spring-scale pop for the ASL prediction letter on change
- `pop`, `blink` keyframes — used by demo section
- `.animate-in` — fires on page load (hero columns), not scroll-gated
- `.stagger-2` → `transition-delay: 90ms`, `.stagger-3` → 180ms, etc.
- `@media (prefers-reduced-motion: reduce)` — disables all the above

### `body.loading` FOUC guard
`js/loader.js` adds `body.loading` before fetching; `css/base.css` has `body.loading { visibility: hidden }`. Removed once all fragments are injected.

CSS `visibility` is inherited but can be overridden by descendants. `css/skeleton.css` uses this:
```css
body.loading .v2-skeleton { visibility: visible; }
```
This lets skeleton shimmer screens show while the real content stays hidden — no JS required.

### Architecture Trace
The ASL Guide case study (`#case-asl-guide`) contains a `<details class="v2-arch-trace">` as a third child of the grid. `.v2-case .v2-arch-trace` in `css/cards.css` sets `grid-column: 1 / -1` so it spans both columns. Each layer is a line (browser green, API orange, data purple). Styling lives in `css/cards.css`.

### Layout grid
One container for every section, hero included: 1320px max width, 56px gutters (24px ≤1024px, 16px ≤600px) — `.v2-inner` in `base.css`, `.v2-hero-inner` in `hero.css`. The contact sign is a named narrower variant (1000px). Key-result rows are a `max-content | 1fr` grid so values never shrink into their descriptions, stacking ≤400px. Stack: 5 columns above 1320px, 3 down to 701px, 2 down to 520px, then 1; titles reserve two lines (≥520px) so tag rows start level. Header controls are 44px. On phones (≤768px) the floating résumé button is hidden (the hero has one), and back-to-top shows only while scrolling up and steps aside over the footer (`js/scroll.js`).

### Transition rule
Only `color` is transitioned on `body` and surface elements — never `background` shorthand (it flashes the wrong theme's surface on toggle).

---

## ASL Hand Skeleton

The `SIGNS` dict contains 21-point pose arrays in MediaPipe landmark order:

```
0: wrist
1–4: thumb (CMC → TIP)
5–8: index  (MCP → TIP)
9–12: middle (MCP → TIP)
13–16: ring   (MCP → TIP)
17–20: pinky  (MCP → TIP)
```

Finger states: `ext`, `extL`, `extR`, `side`, `bent`, `curl`
Thumb states: `up`, `side`, `side2`, `across`, `tuck`, `curl`

The SVG viewBox is `0 0 100 125`. WRIST is at `[50, 112]`.

---

## External Dependencies

| Dependency | Used for |
|---|---|
| Font Awesome Free 6.7.2 icons | **Inlined** as an SVG sprite at the top of `<body>` in `index.html` (20 symbols, CC BY 4.0) — no icon font or CDN request. Use `<svg class="icon" aria-hidden="true"><use href="#i-NAME"/></svg>` in HTML, or `icon()` / `setIcon()` from `js/utils.js`. To add one: copy its path from `@fortawesome/fontawesome-free@6.7.2/svgs/` into a new `<symbol id="i-NAME">` |
| Fira Code (Google Fonts) | Code, logs and live data only |
| Helvetica Neue / Helvetica / Arial (system) | All other type — no download |

No npm, no webpack, no React.

---

## SEO / Meta

- `<meta name="description">` — plain text for crawlers
- Open Graph + Twitter card tags — for social link unfurls
- JSON-LD `Person` schema — for Google rich results
- `assets/img/social-card.jpg` — 1200×630 link-preview card; regenerate it when the title or availability changes (source: `dev/social-card.html`, screenshot at 1200×630 in Chrome). Export as JPEG: `sips -s format jpeg -s formatOptions 88 card.png --out social-card.jpg`

When updating bio copy, keep all four in sync: hero text, `<meta name="description">`, `og:description`, and JSON-LD `description`.

---

## Deployment

**Asset version:** `index.html` (stylesheet link), `css/main.css` (every `@import`) and `js/loader.js` (`ASSET_VERSION`) append `?v=<version>`. Bump it in all three whenever CSS or `html/` changes, or returning visitors can pair new HTML with cached old CSS (GitHub Pages caches for 10 minutes; local `python3 -m http.server` relies on heuristic caching — hard-refresh with ⌘⇧R when testing).


Push to `master` → GitHub Pages deploys automatically. Allow 2–3 minutes for propagation.

```bash
git add -p          # stage selectively — never commit .env or credentials
git commit -m "feat: your message"
git push origin master
```
