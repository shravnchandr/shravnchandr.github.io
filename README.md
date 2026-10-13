# Shravan Chandra — Portfolio

Machine Learning Engineer · Production ML, Applied GenAI, Accessible AI.
Former Senior ML Engineer at Bosch; Master of Data Science at UBC (June 2027).

**Live:** [shravnchandr.github.io](https://shravnchandr.github.io)

---

## What's on the site

- **At a glance** — three projects, one measured result each, linking to the full case studies
- **Experience** — the career drawn as a subway line map: UBC now → Bosch (Senior ML, ML, Software) → Goldman Sachs
- **Selected work** — case studies (problem → what I owned → result → key decision): predictive maintenance, Valfred (multi-agent GenAI data assistant), ASL Guide
- **Research** — sign-language recognition and translation, an IEEE ICCAR 2022 paper, a retinopathy classifier
- **Pipeline replay** — a scripted run of the ASL Guide translation flow
- **Try live** — a small MLP classifies your fingerspelling from the webcam, entirely in the browser (MediaPipe Hands → 63 landmark values → MLP); nothing is uploaded
- ⌘K search, an Accessibility Lab that outlines the page's ARIA structure, and dark/light themes that follow the OS

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

Fully static — no framework, no build step, no package manager.

- `index.html` is a shell; `loader.js` fetches the `html/*.html` sections in parallel
- `script.js` is the ES-module entry point for `js/*`; styles are `css/*`, imported by `css/main.css`
- `asl_model.js` holds the trained MLP weights, loaded only when "Try live" is clicked
- Icons are an inline SVG sprite (Font Awesome Free paths) — no icon font or CDN
- Stylesheets and sections carry an asset version (`?v=…`) so a deploy never mixes new HTML with cached CSS

## Running locally

```bash
python3 -m http.server   # ES modules and fetch() need a server (file:// won't work)
# open http://localhost:8000
```

## Deployment

Push to `master` → GitHub Pages deploys automatically (about a minute). When CSS or `html/` changes, bump the asset version in `index.html`, `css/main.css` and `loader.js`.

---

*Designed and built by Shravan Chandra.*
