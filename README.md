# Shravan Chandra | Senior ML Engineer — Portfolio

Personal portfolio website focused on accessibility AI, production GenAI systems, and end-to-end ML infrastructure.

**Live:** [shravnchandr.github.io](https://shravnchandr.github.io)

---

## Features

### UI/UX
- Responsive design (desktop, tablet, mobile)
- Dark/light theme toggle with `localStorage` persistence
- Material 3 Expressive design system — spring-based motion, M3 press/morph/lift interactions
- Scroll-triggered animations via IntersectionObserver with staggered reveals
- Skeleton shimmer screens while HTML fragments load (no blank flash)
- Fragment prefetching — all `html/*.html` files declared as `<link rel="prefetch">` for near-instant load

### Navigation
- Sticky nav with active-section highlight (IntersectionObserver)
- **Semantic search** (`⌘K` / `Ctrl+K`) — keyword index over all projects, research, and experience; keyboard navigable (↑↓ Enter Escape); grouped results
- **Logo Easter egg** — clicking the logo spells `S-H-R-A-V-A-N` on the hero ASL hand at 2× speed, then resumes the random cycle

### Hero
- Procedural SVG ASL hand skeleton (21-landmark, MediaPipe order) animating through A–Z + 0–9
- **Live webcam ASL classifier** — "Try live →" button activates the camera; MediaPipe Hands feeds world landmarks (21 × x,y,z) into the embedded trained MLP (63→128→64→28) for in-browser inference; no server round-trip
- Live confidence panel with Top-3 predictions and animated confidence bar
- Credential badges: IEEE ICCAR 2022 paper DOI + ASL Guide live app status (live ping)

### Experience (`#story`)
Dual-nav: top tab buttons + right-column role-nav (both in sync). Four tabs: Bosch Senior ML Engineer, Bosch ML Engineer, Bosch Software Developer, Goldman Sachs.

### Projects (`#work`)
Tab-switching panel for two projects, each with a left-column description + right-column metrics:
- **ASL Guide** — LangGraph · TF.js · MediaPipe · FastAPI · Redis · PWA; includes an expandable **Architecture Trace** (`<details>`) showing the full MediaPipe → TF.js → FastAPI → LangGraph → Redis/Postgres data flow
- **Diabetic Retinopathy Classifier** — Xception + Grad-CAM, 96% Kappa

### Research & Publications (`#research`)
Four research entries in a featured + grid layout:
- **VQ-VAE + Conformer Translation System** — 2026, sign-to-gloss-to-text pipeline
- **ST-GCN Sign Language Recognition** — 2025, graph convolutional networks on skeletal sequences
- **Temporal Modeling for Dynamic Signs** — 2024, CNN + Transformer on MS-ASL200
- **IEEE ICCAR 2022** — XGBoost + MediaPipe, dynamic sign language, published DOI

### Live Demo (`#demo`)
Scripted replay of the ASL Guide pipeline: `HELLO WORLD` → grammar agent → translation output. Fires on scroll into view; replayable.

### Accessibility Lab
Toggle button in the nav (universal access icon) activates `body.a11y-lab`:
- CSS outlines highlight ARIA landmarks (orange), `aria-label` elements (teal), and `aria-live` regions (purple)
- Side panel slides in from the right listing six accessibility decisions (ARIA landmarks, labels, live regions, reduced-motion fallback, WCAG-AA contrast, keyboard / skip nav)
- State persisted in `localStorage`

### Contact (`#contact`)
Three CTA buttons — Email (Material Symbols `mail` icon), LinkedIn, GitHub.

### Recruiter Modal
"For Recruiters" trigger button in the contact section opens a spring-animated overlay with role targets (title, location, availability, focus areas) and a 2×2 team-fit grid (Google, Meta, Amazon, Microsoft with specific team names).

### Console Easter Egg
DevTools console prints a styled `%c` banner: stack summary and a GitHub invite for curious engineers who open the console.

---

## Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Properties), Vanilla JavaScript ES modules — no build tools, no npm
- **Design system**: Material 3 Expressive (custom CSS implementation)
- **Icons**: Font Awesome 6.7.2 (UI + brand icons), Material Symbols Outlined (contact section)
- **Fonts**: Google Sans Flex (local TTF), Fira Code + Outfit (Google Fonts CDN)

---

## Project Structure

```
index.html                  # Lean shell — head, fragment placeholders, skeleton screens
loader.js                   # Fetches html/*.html in parallel; sets window.__sectionsReady
script.js                   # ES module entry point — imports js/* and calls initApp()

js/
  utils.js                  # Shared DOM helpers: el(), makeOverlay(), makeTop3Row(), updateLetterDisplay(), clearEl()
  theme.js                  # Dark/light toggle (localStorage key: 'theme-v2')
  nav.js                    # Hamburger, active-section highlight, logo Easter egg (spellSequence)
  scroll.js                 # Scroll-reveal, CountUp, back-to-top, smooth scroll
  tabs.js                   # Work tab switcher + Story dual-nav
  asl.js                    # Procedural SVG ASL hand; exports initASL, SIGNS, CONNECTIONS, spellSequence, pauseASL, resumeASL, drawHandPose
  demo.js                   # Scripted ASL pipeline demo (HELLO WORLD)
  a11y.js                   # Accessibility Lab toggle + side panel
  search.js                 # ⌘K semantic search overlay (keyword index, keyboard nav)
  webcam.js                 # Live webcam ASL classifier: MediaPipe Hands + MLP inference on world landmarks
  recruiter.js              # Recruiter modal: role targets + team-fit grid (pure DOM, no innerHTML)

html/
  nav.html                  # Nav: logo, pill links, search trigger, theme toggle, a11y btn, hire-me
  hero.html                 # Hero: headline, ASL card, credential badges
  impact.html               # 6 CountUp impact metrics  (01 · IMPACT)
  story.html                # Experience tabs + role-nav + education  (02 · WORK)
  work.html                 # Project tabs with Architecture Trace on ASL Guide  (03 · SELECTED PROJECTS)
  research.html             # Research & Publications: 4 papers  (04 · RESEARCH · PUBLICATIONS)
  demo.html                 # Live demo section  (05 · LIVE DEMO)
  stack.html                # 5-column skills grid  (06 · STACK)
  now.html                  # Now + OSS contributions  (07 · NOW)
  contact.html              # Contact CTAs (Email / LinkedIn / GitHub)  (08 · NEXT)

css/
  main.css                  # @import entry point — no legacy layers
  variables.css             # All design tokens (dark + light-theme palette)
  base.css                  # body/reset rules, @font-face, .v2-section, shared modal/panel base classes, FOUC guard
  skeleton.css              # Shimmer skeleton screens (nav, hero, impact, below-fold)
  nav.css                   # Sticky nav, mobile responsive
  hero.css                  # Hero layout, ASL card, wavy underline SVG
  impact.css                # 6-cell metrics grid
  demo.css                  # Live demo section
  story.css                 # Experience tabs, role-nav, education
  tabs.css                  # .v2-tab, .v2-tab-panel show/hide
  cards.css                 # Panel chrome, badges, buttons, Architecture Trace diagram
  research.css              # Research section: featured card, 2-col row, bullet list
  stack.css                 # Skills grid
  now.css                   # Now + OSS cards
  contact.css               # Contact section gradient bg + icon sizing
  a11y.css                  # Accessibility Lab toggle, side panel, ARIA highlight overlays
  search.css                # ⌘K search overlay, modal, results, nav trigger
  webcam.css                # Webcam video overlay, toggle button, status dot
  recruiter.css             # Recruiter modal overlay, team-fit grid
  animations.css            # M3 spring keyframes — loaded last

asl_model.js                # Trained MLP weights + StandardScaler (loaded lazily by webcam.js on first activation)
robots.txt                  # Crawl rules (allow all) + sitemap pointer
sitemap.xml                 # URL index for SEO
```

---

## Running Locally

```bash
# ES modules and fetch() require a local server (file:// breaks CORS)
python3 -m http.server
# Open http://localhost:8000
```

---

## Deployment

Push to `master` → GitHub Pages deploys automatically. Allow 2–3 minutes for propagation.

```bash
git add -p          # stage selectively
git commit -m "feat: your message"
git push origin master
```

---

*Designed and developed by Shravan Chandra.*
