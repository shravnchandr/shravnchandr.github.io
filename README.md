# Shravan Chandra | Senior ML Engineer — Portfolio

Personal portfolio website focused on accessibility AI, production GenAI systems, and end-to-end ML infrastructure.

**Live:** [shravnchandr.github.io](https://shravnchandr.github.io)

---

## Features

### UI/UX
- Responsive design (desktop, tablet, mobile)
- Dark/Light theme toggle with `localStorage` persistence and `prefers-color-scheme` fallback
- Canvas particle animation in hero section (respects `prefers-reduced-motion`, pauses when tab hidden)
- Scroll-triggered animations via IntersectionObserver with staggered reveals
- Material 3 Expressive design system with spring-based motion

### Hero Badges
Two credential badges below the CTA buttons:
- **Published in IEEE ICCAR 2022** — links to the paper DOI
- **ASL Guide — Live Production App** — links to the deployed app

### Projects
- **ASL Guide** (featured) — full-stack production ASL learning platform with LangGraph agentic workflow, TensorFlow.js in-browser classifier, SM-2 spaced repetition, PWA, Redis caching
- **Sign-Language Temporal Modeling** — CNN + transformer research on MS-ASL200
- **Diabetic Retinopathy Classifier** — Xception + Grad-CAM, 96% Kappa Score
- **IEEE Publication** — ICCAR 2022, sign language recognition

---

## Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Properties), Vanilla JavaScript (ES6+)
- **Design system**: Material 3 Expressive (custom CSS implementation)
- **Icons**: Font Awesome 6.4
- **Fonts**: Google Sans Flex (local), Fira Code + Outfit (Google Fonts CDN)

---

## Project Structure

```
index.html              # Single-page app — all content
script.js               # All JS logic: UI, theme, particles, project filters, ASL modals
asl_model.js            # Pre-trained MLP weights + StandardScaler params as JS globals
export_model.py         # Generates asl_model.js from a trained PyTorch model
css/
├── main.css            # Cascading @import entry point
├── variables.css       # All design tokens (M3 colors, type scale, spring motion)
├── base.css            # Reset and typography
├── layout.css          # Container, grid, flex, spacing utilities
├── animations.css      # Spring keyframes and scroll animation classes
├── components/         # buttons, cards, modals, navbar, footer
└── sections/           # hero, metrics, about, skills, experience, projects, contact
```

---

## Running Locally

```bash
# Recommended — avoids CORS issues with webcam and MediaPipe CDN
python3 -m http.server
# Open http://localhost:8000
```

Direct `open index.html` works for basic browsing.

---

## Deployment

Auto-deploys to GitHub Pages on push to `master`. Allow 2–3 minutes after push.

```bash
git add .
git commit -m "your message"
git push origin master
```

---

*Designed and developed by Shravan Chandra.*
