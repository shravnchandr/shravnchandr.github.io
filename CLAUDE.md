# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Personal portfolio website for Shravan Chandra, Senior ML Engineer. Single-page application focused on accessibility AI, production GenAI, and end-to-end ML infrastructure.

**Deployment target:** GitHub Pages (`shravnchandr.github.io`), auto-deploys on push to `master`.

---

## Running Locally

```bash
# Use a local server — direct file:// access breaks webcam (CORS) and MediaPipe CDN loading
python3 -m http.server
# Visit http://localhost:8000
```

---

## Architecture

**Fully static site** — no build tools, bundlers, package managers, or compilation step. Edit files and refresh the browser.

### File Map

```
index.html                  # Single-page app, all HTML content
script.js                   # All JS logic (~830 lines), no modules or imports
asl_model.js                # Pre-trained MLP weights exported as JS globals
css/main.css                # Cascading @import entry point for all stylesheets
css/variables.css           # All design tokens (M3 colors, type scale, motion)
css/base.css                # Reset, global typography
css/layout.css              # Grid, container, flex utilities
css/animations.css          # Spring-based @keyframes
css/components/             # buttons, cards, modals, navbar, footer
css/sections/               # hero, metrics, about, skills, experience, projects, contact
export_model.py             # Generates asl_model.js from a trained PyTorch model
Live Recognition.py         # Local Python webcam ASL recognition (dev/training tool)
ASL Dictionary.py           # Python CLI version of the ASL dictionary
og-image.png                # 1200×630 social share image
favicon.svg                 # SVG favicon
Shravan_Chandra_Resume.pdf  # Downloadable resume (linked from hero + FAB)
GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf  # Local font file
```

---

## Page Structure (`index.html`)

Sections in order:
1. **Nav** — logo, theme toggle, mobile hamburger, nav links (About / Skills / Experience / Projects / Contact)
2. **Hero** — name, typewriter title, description, CTA buttons, two badges (IEEE + ASL Guide), scroll indicator
3. **Metrics** — 5+ Years Experience, €300K+ Annual Savings, 100+ ECUs Monitored, 48% Faster Training
4. **About** — personal story (left-handed user anecdote), relocation intent, tech stack
5. **Skills** — ML/DL, GenAI & LLMs, Data & MLOps, Languages, Infrastructure
6. **Experience** — timeline with 4 entries (see below)
7. **Projects** — filterable grid with 4 cards (see below)
8. **Contact** — mailto + social links
9. **Footer** — copyright year (set dynamically via `id="year"`)

### Experience Entries (in order)
| Title | Company | Dates |
|---|---|---|
| Senior Machine Learning Engineer | Bosch Global Software Technologies | Jan 2025 – Present |
| Machine Learning Engineer | Bosch Global Software Technologies | Aug 2023 – Dec 2024 |
| Software Developer | Bosch Global Software Technologies | Aug 2021 – Aug 2023 |
| Junior Analyst (Internship) | Goldman Sachs | Jan 2021 – Jul 2021 |

### Project Cards (in order)
| Project | Category | Notes |
|---|---|---|
| ASL Guide — Production ASL Learning Platform | `genai` | Featured card, full-width, links to live app + GitHub |
| Sign-Language Temporal Modeling | `research` | Research work, no links |
| Diabetic Retinopathy Classifier with XAI | `ml-cv` | Links to GitHub |
| IEEE Publication — ASL Recognition | `research` | Links to DOI |

Filter categories: `all`, `ml-cv`, `genai`, `research`

### Hero Badges
Two `.publication-badge` elements inside `.hero-badge` (flex container):
- IEEE ICCAR 2022 — links to `doi.org/10.1109/ICCAR55106.2022.9782661`
- ASL Guide Live App — links to `asl-guide.onrender.com`

---

## JavaScript Architecture (`script.js`)

All logic lives in `script.js` as a single file with module-like `init*()` functions. Everything fires on `DOMContentLoaded`:

```js
initTheme()          // Dark/light mode toggle + system preference detection
initUI()             // Remove no-js class, typewriter, scroll animations, smooth scroll
initMobileMenu()     // Hamburger menu open/close, ARIA, outside-click-to-close
initParticles()      // Canvas particle animation in hero background
initBackToTop()      // FAB visible after 300px scroll
initActiveNav()      // IntersectionObserver highlights active nav link
initProjectFilters() // data-category filter buttons on project cards
```

### State & Storage

- **Theme**: `localStorage('theme')` → `'dark-theme'` or `'light-theme'`. Falls back to `prefers-color-scheme`.
- All other state is managed via closures inside each `init*()` function. No global state object.

### Scroll Animations

Elements with `.animate-on-scroll` are observed via `IntersectionObserver`. The `.show` class is added when they enter the viewport (threshold 0.15, rootMargin `-50px`). Stagger delays are applied via `.stagger-2` through `.stagger-5` CSS classes.

### Project Filters

Each `.project-card` has a `data-category` attribute (`ml-cv`, `genai`, `research`). Filter buttons carry `data-filter`. Clicking a button toggles `hidden` class on non-matching cards and plays `spring-scale-in` on shown ones.

---

## ASL Model (local dev artifact)

`asl_model.js` is a trained model export kept in the repo as a reference artifact but not loaded by the site. To reintegrate the in-browser ASL demo:
1. Add trigger buttons and modal HTML back to `index.html`
2. Add back `<script src="asl_model.js">` and the 4 MediaPipe CDN scripts
3. Restore `initASLDemo` / `initASLDictionary` in `script.js` (recoverable from git history)

Model details: 3-layer MLP `63 → 128 → 64 → 28` (A–Z + DEL + SPACE). Weights + StandardScaler exported via `export_model.py`.

---

## CSS Design System

### Material 3 Expressive (custom implementation)

All design tokens are in `css/variables.css`. Key tokens:

```css
/* Primary palette */
--md-sys-color-primary: #006874          /* Deep Cyan (light mode) */
--md-sys-color-primary-container: #97f0ff

/* ML accent colors (used for skill tags, highlights) */
--ml-accent-neural: #7c4dff
--ml-accent-data: #00bfa5
--ml-accent-inference: #ff6d00

/* Spring motion (use these, not plain ease-in-out) */
--spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
--spring-smooth: cubic-bezier(0.22, 0.61, 0.36, 1)
--spring-snappy: cubic-bezier(0.68, -0.55, 0.265, 1.55)
--spring-duration-short: 300ms
--spring-duration-medium: 500ms

/* Responsive type scale (clamp-based) */
--md-sys-typescale-display-large: clamp(48px, 8vw, 64px)
--md-sys-typescale-body-large: clamp(16px, 2vw, 18px)
```

Dark mode is applied by adding `.dark-theme` to `<body>`. Variables override themselves under `.dark-theme` in `variables.css`.

### CSS File Responsibilities

| File | Purpose |
|---|---|
| `variables.css` | All tokens — touch this for color, spacing, motion changes |
| `base.css` | Resets, `body`, `h1–h6`, `p`, `a`, `code` |
| `layout.css` | `.container`, `.grid`, `.flex`, `.gap-*`, `.mt-*` utilities |
| `animations.css` | `@keyframes` + `.animate-in`, `.animate-on-scroll`, stagger classes |
| `components/cards.css` | `.card` base styles, `.project-card`, `.skill-category` |
| `components/modals.css` | `.modal` overlay, `.close-modal`, show/hide transitions |
| `sections/hero.css` | Hero layout, typewriter, `.hero-badge` (flex), `.publication-badge`, particle canvas, scroll indicator |
| `sections/metrics.css` | Metrics strip below hero |
| `sections/projects.css` | Projects grid, `.featured-project`, filter buttons, `.project-tech` tags |

---

## Particles (`initParticles`)

- Draws on `<canvas id="hero-canvas">` in the hero section
- Respects `prefers-reduced-motion` — hidden entirely if user prefers reduced motion
- Pauses via `cancelAnimationFrame` when tab is hidden (`visibilitychange` event)
- Mouse repulsion within 150px radius
- Particle count: capped at 150, density-scaled by viewport area (fewer on mobile)
- Particle color is read live from `--md-sys-color-primary` CSS variable, so it updates on theme change via `MutationObserver` on `body.className`

---

## External Dependencies (CDN only)

| Dependency | Source | Used for |
|---|---|---|
| Font Awesome 6.4.0 | `cdnjs.cloudflare.com` | All icons |
| Fira Code, Outfit | Google Fonts | Body and code typography |
| Google Sans Flex | Local TTF file | Display headings |

No npm, no webpack, no React. All dependencies load via `<link>` tags in `index.html`.

---

## SEO / Meta

- `<meta name="description">` — plain description for search crawlers
- Open Graph (`og:description`, `og:image`) and Twitter card tags — for social sharing
- JSON-LD structured data (`application/ld+json`) — Person schema for Google rich results
- `og-image.png` is the 1200×630 preview image for link unfurls

When updating bio content, keep all four in sync: hero text, about section, meta description, and JSON-LD description.

---

## Deployment

Push to `master` → GitHub Pages deploys automatically. No CI/CD config required. Allow 2–3 minutes for propagation.

```bash
git add index.html
git commit -m "your message"
git push origin master
```
