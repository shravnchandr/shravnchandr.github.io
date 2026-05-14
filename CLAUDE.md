# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Personal portfolio website for Shravan Chandra, Senior ML Engineer. Single-page application focused on accessibility AI, production GenAI, and end-to-end ML infrastructure.

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

The site uses a **v2 Dark Bold · Lab** design (Material 3 Expressive). All styles are under `css/`, all HTML fragments in `html/`, all JS in `js/`. The old `script.js` (single-file) has been replaced by ES modules.

### File Map

```
index.html                  # Shell: head, <link rel="prefetch"> for all fragments, skeleton screens, persistent UI
loader.js                   # Fetches html/*.html fragments in parallel, sets __sectionsReady
script.js                   # ES module entry point — imports js/* and calls initApp()

js/
  utils.js                  # Shared DOM helpers: el(), makeOverlay(), makeTop3Row(), updateLetterDisplay()
  theme.js                  # Dark/light toggle (localStorage key: 'theme-v2')
  nav.js                    # Mobile hamburger + active-section highlight + logo Easter egg
  scroll.js                 # Scroll-reveal, CountUp, back-to-top, smooth scroll
  tabs.js                   # Work tab switcher + Story dual-nav (top tabs + role-nav)
  asl.js                    # Procedural SVG ASL hand; random cycle + spellSequence() override
  demo.js                   # Scripted ASL pipeline demo (HELLO WORLD → grammar → output)
  a11y.js                   # Accessibility Lab toggle + side panel (ARIA overlays)
  search.js                 # ⌘K semantic search overlay — keyword index, keyboard nav
  webcam.js                 # Live webcam ASL classifier: MediaPipe Hands + MLP inference
  recruiter.js              # Recruiter modal overlay (pure DOM, spring-animated)

html/
  nav.html                  # <nav>: logo, pill nav, search trigger, theme toggle, a11y btn, hire-me
  hero.html                 # Hero: headline, live ASL recognition CTA, ASL card
  impact.html               # 6 impact metrics (CountUp on scroll)
  story.html                # Experience tabs + role-nav + education block  (02 · WORK)
  work.html                 # Project tabs: ASL Guide (+ Architecture Trace), Retinopathy  (03 · SELECTED PROJECTS)
  research.html             # Research & Publications: 4 papers  (04 · RESEARCH · PUBLICATIONS)
  demo.html                 # Live Demo section: scripted ASL Guide pipeline replay  (05 · LIVE DEMO)
  stack.html                # 5-column skills grid  (06 · STACK)
  now.html                  # "What I'm on" + OSS contributions  (07 · NOW)
  contact.html              # Contact h2, 3 CTA buttons (Email / LinkedIn / GitHub)  (08 · NEXT)

css/
  main.css                  # @import entry point — no legacy layers
  variables.css             # All design tokens (dark + light-theme palette)
  base.css                  # body/reset rules, @font-face, .v2-section, .v2-modal-overlay, .v2-panel-close, FOUC guard
  skeleton.css              # Shimmer screens for nav/hero/impact/below-fold (visibility override trick)
  nav.css                   # .v2-nav sticky + mobile responsive
  hero.css                  # Hero layout, ASL card, status badge, wavy underline SVG
  impact.css                # 6-cell metrics grid
  demo.css                  # Live demo section: webcam panel, pipeline panel, log
  story.css                 # Experience tabs, role-nav, education
  tabs.css                  # .v2-tab, .v2-tab-panel show/hide
  cards.css                 # .v2-panel-chrome, badges, buttons (.v2-btn-*), Architecture Trace diagram
  research.css              # Research section: featured card, 2-col row, bullet list
  stack.css                 # 5-col skill categories grid
  now.css                   # Now + OSS cards
  contact.css               # Contact section gradient bg + icon sizing
  a11y.css                  # Accessibility Lab toggle btn, side panel, ARIA highlight overlays
  search.css                # ⌘K overlay, modal, results list, nav trigger btn
  webcam.css                # Webcam video overlay, toggle button (.v2-webcam-*), status dot
  recruiter.css             # Recruiter modal overlay (z-index: 2100), team-fit grid
  animations.css            # M3 spring keyframes, [data-m3-press], [data-m3-morph],
                            #   [data-hover-lift], .animate-in, .stagger-2–5 — LOADED LAST

asl_model.js                # Trained MLP weights + StandardScaler; loaded lazily by webcam.js
                            # Defines two globals: ASL_MODEL_DATA and ASL_SCALER_DATA
                            # Format: { model: {fc1_w,fc1_b,fc2_w,fc2_b,fc3_w,fc3_b}, scaler: {mean,scale} }
                            # Weights stored TRANSPOSED: shape [in_features][out_features]
dev/export_model.py         # PyTorch → JSON export script (generates asl_model.js; gitignored)
og-image.png                # 1200×630 social share image
favicon.svg                 # SVG favicon
Shravan_Chandra_Resume.pdf  # Downloadable resume
```

---

## How the Page Loads

```
index.html parsed
  │
  ├─ loader.js (plain <script>, runs immediately)
  │    └─ bootstrap() — fetch html/*.html in parallel
  │         └─ each placeholder <div id="frag-*"> replaced by outerHTML of fetched fragment
  │         └─ body.classList.remove('loading')  ← FOUC guard
  │         └─ calls window.__onSectionsReady() or sets window.__sectionsReady = true
  │
  └─ script.js (type="module", deferred by default)
       └─ if (window.__sectionsReady) initApp();
          else window.__onSectionsReady = initApp;
```

`body.loading { visibility: hidden }` (in `css/base.css`) prevents any flash while fragments are being fetched.

---

## Page Structure

Sections load in this order (matching `loader.js` FRAGMENTS array):

| # | Fragment | Section id | Description |
|---|---|---|---|
| 1 | nav.html | — | Sticky nav |
| 2 | hero.html | — | Headline + ASL demo card |
| 3 | impact.html | — | 6 impact metrics (01 · IMPACT) |
| 4 | story.html | `#story` | Experience tabs (02 · WORK) |
| 5 | work.html | `#work` | Project tabs (03 · SELECTED PROJECTS) |
| 6 | research.html | `#research` | Research & Publications (04 · RESEARCH) |
| 7 | demo.html | `#demo` | Live ASL pipeline demo (05 · LIVE DEMO) |
| 8 | stack.html | `#stack` | Skills grid (06 · STACK) |
| 9 | now.html | `#now` | Now + OSS (07 · NOW) |
| 10 | contact.html | `#contact` | Contact (08 · NEXT) |

### Project tabs (`#work`)
`data-tab` buttons + `data-tab-panel` panels: `asl-guide`, `retinopathy`

### Experience tabs (`#story`)
`data-story` top buttons + `data-story-panel` panels: `bosch-sr`, `bosch-ml`, `bosch-swe`, `goldman`
`data-role` right-column role-nav buttons mirror the same keys.

---

## JavaScript Architecture

All modules use ES module syntax (`export function init*()`).

### `script.js` (entry point)
```js
import { initTheme }    from './js/theme.js';
import { initNav }      from './js/nav.js';
import { initScroll }   from './js/scroll.js';
import { initTabs }     from './js/tabs.js';
import { initASL }      from './js/asl.js';
import { initDemo }     from './js/demo.js';
import { initA11yLab }  from './js/a11y.js';
import { initSearch }   from './js/search.js';
import { initWebcam }   from './js/webcam.js';
import { initRecruiter }from './js/recruiter.js';

function initApp() { /* calls all inits + console Easter egg */ }

if (window.__sectionsReady) initApp();
else window.__onSectionsReady = initApp;
```

### `js/utils.js`
Shared DOM/UI helpers imported by `a11y.js`, `search.js`, `recruiter.js`, `asl.js`, `webcam.js`.

- `el(tag, cls, attrs)` — creates an element, sets className, applies attr key/value pairs
- `makeOverlay(extraClass, ariaLabel)` — builds the standard modal overlay div with `role="dialog"`, `aria-modal`, `aria-hidden`; base styles from `.v2-modal-overlay` in `css/base.css`
- `makeTop3Row(rank, letter, pct, isTop)` — builds a `.v2-t3-row` confidence bar row (label + fill bar)
- `updateLetterDisplay(letterEl, key, prevKey)` — swaps letter text and re-triggers `m3LetterPop` animation via reflow
- `clearEl(element)` — removes all child nodes from a DOM element; replaces the repeated `while (el.firstChild) el.removeChild(el.firstChild)` idiom

### `js/asl.js`
Exports `initASL`, `SIGNS`, `CONNECTIONS`, `spellSequence`, `pauseASL`, `resumeASL`, `drawHandPose`.

- `SPEC`: 36-entry dict mapping sign keys → `[thumbState, idx, mid, rng, pnk]` finger states (module-internal, not exported)
- `SIGNS`: 36 ASL poses (A–Z + 0–9), each a 21-point array `[[x,y], …]` (procedural rendering geometry built from SPEC via `buildPose`)
- `CONNECTIONS`: 21 MediaPipe-style connection pairs for drawing the skeleton
- `buildPose(thumb, index, middle, ring, pinky)`: composes pose from per-finger states
- State machine: **hold** 1100ms → **morph** 420ms, lerped with `easeIO`
- `updatePanel(key, conf)`: re-triggers `m3LetterPop` CSS animation on letter change
- Pauses on `document.hidden`; respects `prefers-reduced-motion`
- `spellSequence(letters, onDone?)`: module-level override — sets `_seqQueue`; on the next `tick()` frame the state machine hijacks to the sequence at 2× speed (hold 550ms / morph 280ms) then resumes random cycle. Silently ignored if a sequence is already playing.
- `pauseASL()` / `resumeASL()` / `drawHandPose(pose)`: refs wired inside `initASL`; called by `webcam.js` to pause the random cycle and draw live MediaPipe landmarks instead.

### `js/nav.js`
- `initMobileMenu`: hamburger toggle, close on link click or outside click
- `initActiveNav`: IntersectionObserver highlights the active pill nav link
- `initLogoEasterEgg`: clicking `.v2-logo` calls `spellSequence(['S','H','R','A','V','A','N'])` and smooth-scrolls to top; `preventDefault` suppresses the `href="/"` reload

### `js/a11y.js`
- `initA11yLab()` — wires `#a11y-lab-btn` (nav) and `#a11y-panel` (persistent aside in index.html)
- `_buildPanel(panel)` — constructs side panel via pure DOM manipulation (no innerHTML): header + close button, colour legend, 6 feature rows
- `setActive(on)` — toggles `body.a11y-lab`, `aria-pressed`, `.v2-a11y-panel--open`, `aria-hidden`; persists to `localStorage` key `a11y-lab`
- `body.a11y-lab` activates CSS outline overlays in `css/a11y.css`: orange dashes on landmarks, teal on `aria-label` elements, purple on `aria-live` regions

### `js/search.js`
- `initSearch()` — builds the search overlay via DOM, binds `⌘K`/`Ctrl+K`, wires `#search-trigger` in the nav
- `INDEX`: 11 entries (2 projects + 4 research + 4 experience + 1 education), each with `tokens[]`, `label`, `sub`, `icon`, `action()`
- `_query(raw)` — tokenises query (strips stop words, normalises), scores against `INDEX`:
  - Exact match: `+5` (len ≥ 5), `+3` (len ≥ 3), `+1` (short)
  - Prefix match (query is prefix of token, len ≥ 3): `+2`
  - Substring match (query inside token, len ≥ 3): `+1`
  - **No `w.includes(t)` direction** — avoids false positives (e.g. token `"ecu"` inside query `"because"`)
- Results grouped into Projects / Experience & Education; keyboard nav (↑↓ Enter Escape)
- `action()` on project/experience entries calls `_selectTab(selector, sectionId)` which clicks the correct tab and scrolls; research entries call `_scrollTo('#research')`

### `js/demo.js`
Imports `SIGNS`, `CONNECTIONS` from `./asl.js`.

- Scripted sequence: `H E L L O · W O R L D`
- Updates `#demo-asl-svg`, `#demo-buffer`, `#demo-grammar`, `#demo-output`, `#demo-log`
- Fires when `#demo` section scrolls into view (IntersectionObserver, threshold 0.25)
- `#demo-replay-btn` resets and reruns
- No innerHTML — all DOM updates via `createElement` / `textContent` / `appendChild`

### `js/webcam.js`
- `initWebcam()` — wires `#webcam-toggle`, hides button if `getUserMedia` unavailable, kicks off `checkAppStatus()`
- `checkAppStatus()` — pings `asl-guide.onrender.com` with `fetch` no-cors + 7s AbortController timeout; updates `#asl-status-dot` / `#asl-status-label` (live / waking up / offline)
- On button click: loads `asl_model.js` and `@mediapipe/hands` CDN **in parallel** via `_loadScript`, then initialises MediaPipe Hands and starts `getUserMedia`
- `_classify(worldLandmarks)` — runs the MLP forward pass:
  1. Flatten 21 × `{x,y,z}` world landmarks → 63 floats
  2. StandardScaler: `(val − mean[i]) / scale[i]` (from `ASL_MODEL_DATA.scaler`)
  3. Forward: `_matMul` (transposed weights `[in][out]`) + ReLU × 2, then logits
  4. Softmax → top-3 `{key, conf}` (keys: A–Z, DEL, SPC)
- `_matMul(input, W, bias)` — correct transposed-weight multiply: `out[j] = Σ_i(input[i] × W[i][j]) + bias[j]`
- `_onResults` uses `multiHandLandmarks[0]` for SVG drawing (`drawHandPose`) and `multiHandWorldLandmarks[0]` for MLP inference
- **Critical**: `asl_model.js` weights are transposed (`[in_features][out_features]`) — `_matMul` must iterate outer index over `in` and inner index over `out`, NOT the reverse (the original pre-v2 script had this swapped)

### `js/recruiter.js`
- `initRecruiter()` — builds a spring-animated overlay modal via pure DOM (no innerHTML)
- `ROLE_TARGETS`: title, location, availability, focus areas
- `TEAM_FITS`: 4 companies (Google, Meta, Amazon, Microsoft) with specific team names
- Trigger button in contact section (`#recruiter-trigger`); close on overlay click or Escape
- `z-index: 2100` (above everything else)

### `js/scroll.js`
- `initScrollReveal`: adds `.show` to `.animate-on-scroll` on intersection (threshold 0.12)
- `initCountUp`: parses `.v2-metric-val` text (e.g. `€300K+`) and counts up on intersection
- `initBackToTop`: shows `#back-to-top` after 300px scroll
- `initSmoothScroll`: all `a[href^="#"]` → `scrollIntoView({behavior:'smooth'})`

### `js/tabs.js`
- `initWorkTabs`: `#work-tabs .v2-tab` → `data-tab` ↔ `data-tab-panel`
- `initStoryTabs`: syncs `#story-tabs .v2-tab` (via `data-story`), `#role-nav .v2-role-btn` (via `data-role`), and `[data-story-panel]` panels

---

## CSS Design System

### Dark-default theme
`:root` in `css/variables.css` defines the dark palette. `body.light-theme` overrides to warm cream. Theme key in localStorage is `theme-v2` (the old key `theme` drove the legacy dark-theme/light-theme class system — do not reuse it).

### v2 colour tokens (in `css/variables.css`)
```css
:root {
  --v2-bg: #0b0f14;           /* page background */
  --v2-surface: #131820;      /* card surface */
  --v2-surface-hi: #1a212c;   /* elevated surface */
  --v2-surface-hi2: #222a36;  /* hover state */
  --v2-border: #2a3342;
  --v2-text: #e6ebf2;
  --v2-text-dim: #a0a9b8;
  --v2-text-muted: #6b7585;
  --v2-neural: #7c4dff;       /* purple accent */
  --v2-data: #00bfa5;         /* teal accent */
  --v2-inference: #ff6d00;    /* orange accent */
}
body.light-theme {
  --v2-bg: #f7f5f0;           /* warm cream */
  --v2-surface: #ffffff;
  /* … overrides … */
}
```

### M3 Expressive motion (`css/animations.css`)
- `[data-m3-press]` — spring press-state on buttons (scale 0.94 on active, bounce back)
- `[data-m3-morph]` — primary CTAs morph to pill (`border-radius: 999px`) on hover
- `[data-hover-lift]` — cards translateY(-3px) with spring easing on hover
- `m3LetterPop` keyframe — spring-scale pop for the ASL prediction letter on change
- `scan`, `pop`, `blink` keyframes — used by demo section
- `.animate-in` — fires on page load (hero columns), not scroll-gated
- `.stagger-2` → `transition-delay: 90ms`, `.stagger-3` → 180ms, etc.
- `@media (prefers-reduced-motion: reduce)` — disables all the above

### `body.loading` FOUC guard
`loader.js` adds `body.loading` before fetching; `css/base.css` has `body.loading { visibility: hidden }`. Removed once all fragments are injected.

CSS `visibility` is inherited but can be overridden by descendants. `css/skeleton.css` uses this:
```css
body.loading .v2-skeleton { visibility: visible; }
```
This lets skeleton shimmer screens show while the real content stays hidden — no JS required.

### Architecture Trace
The ASL Guide tab panel (`#panel-asl-guide`) contains a `<details class="v2-arch-trace">` as a third child of the grid. `css/tabs.css` sets `grid-column: 1 / -1` so it spans both columns. Styling lives in `css/cards.css` under the `/* ── Architecture Trace ── */` section.

### Transition rule
Only `color` is transitioned on `body` and surface elements — never `background` shorthand (browsers can't interpolate multi-layer radial gradients and pin the computed value to the wrong theme).

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

## External Dependencies (CDN only)

| Dependency | Used for |
|---|---|
| Font Awesome 6.7.2 (cdnjs) | UI icons + brand icons (GitHub, LinkedIn) |
| Material Symbols Outlined (Google Fonts) | Contact section `mail` icon |
| Fira Code, Outfit (Google Fonts) | Body and mono typography |
| Google Sans Flex (local TTF) | Display headings |

No npm, no webpack, no React.

---

## SEO / Meta

- `<meta name="description">` — plain text for crawlers
- Open Graph + Twitter card tags — for social link unfurls
- JSON-LD `Person` schema — for Google rich results
- `og-image.png` — 1200×630 preview image

When updating bio copy, keep all four in sync: hero text, `<meta name="description">`, `og:description`, and JSON-LD `description`.

---

## Deployment

Push to `master` → GitHub Pages deploys automatically. Allow 2–3 minutes for propagation.

```bash
git add -p          # stage selectively — never commit .env or credentials
git commit -m "feat: your message"
git push origin master
```
