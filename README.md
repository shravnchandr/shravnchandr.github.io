# Shravan Chandra — Portfolio

Machine Learning Engineer · Production ML, Applied GenAI, Accessible AI.
Former Senior ML Engineer at Bosch; Master of Data Science at UBC (June 2027).

**Live:** [shravnchandr.github.io](https://shravnchandr.github.io)

---

## What's on the site

- **At a glance** — three projects, one measured result each, linking to the full case studies
- **Experience** — the career drawn as a subway line map: UBC now → Bosch (Senior ML, ML, Software) → Goldman Sachs
- **Selected work** — case studies (problem → what I owned → result → key decision): predictive maintenance, Valfred (multi-agent GenAI data assistant), ASL Guide
- **Research** — signer-independent sign recognition (from isolated signs toward continuous signing, tested on signers the model never saw, with its own line of stations from 2022 to now), an IEEE ICCAR 2022 paper, a retinopathy classifier
- **Pipeline replay** — a scripted concept replay: recognition as in ASL Guide, then a prototype grammar pass into English
- **Try live** — a small MLP classifies your fingerspelling from the webcam, entirely in the browser (MediaPipe Hands → 63 landmark values → MLP); nothing is uploaded
- ⌘K search, an Accessibility Lab that outlines the page's ARIA structure, pause controls for every animation (reduced motion honoured live), and dark/light themes that follow the OS

## Design

An NYC Subway signage system, after the 1970 NYCTA Graphics Standards Manual: black signs with a thin white rule, Helvetica, and route bullets whose colours mean something.

| Line | Meaning |
|---|---|
| **M** blue | Production ML |
| **G** purple | Applied GenAI |
| **D** orange | Data infrastructure |
| **S** green | Software & tooling |
| **A** yellow | Accessible AI & sign language |
| **R** teal | Research & coursework |

Sections are numbered stations (1 At a Glance … 8 Next Stop). Full rules: [`CLAUDE.md`](CLAUDE.md).

## How it's built

Fully static — no framework, no package manager; the only build is a small standard-library Python script.

- Sections live in `html/*.html`. On deploy, `dev/build.py` writes them into `index.html`, so the live page is complete HTML that any reader or crawler can read; locally, `js/loader.js` fetches them at runtime, so you edit and refresh with no build
- `js/main.js` is the ES-module entry point; styles are `css/*`, imported by `css/main.css`
- `js/asl_model.js` holds the trained MLP weights, loaded only when "Try live" is clicked
- Icons are an inline SVG sprite (Font Awesome Free paths) — no icon font or CDN
- On deploy the CSS is bundled into one file named by a hash of its contents (`css/site.<hash>.css`), so a deploy never mixes new HTML with cached CSS and there are no version strings to bump

## Running locally

```bash
python3 -m http.server   # ES modules and fetch() need a server (file:// won't work)
# open http://localhost:8000

python3 dev/build.py && python3 -m http.server -d _site   # preview the deployed (built) page
```

## Deployment

Push to `master` → a GitHub Action builds (`dev/build.py`) and deploys to GitHub Pages (about a minute). Images live in `assets/img/`; the root keeps only files that must be there (pages, icons, robots/sitemap, the public résumé PDF).

---

*Designed and built by Shravan Chandra.*
