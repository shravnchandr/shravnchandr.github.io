# Shravan Chandra | Senior ML Engineer — Portfolio

Personal portfolio website with integrated AI demonstrations. Built with accessibility AI as the core focus.

**Live:** [shravnchandr.github.io](https://shravnchandr.github.io)

---

## Features

### UI/UX
- Responsive design (desktop, tablet, mobile)
- Dark/Light theme toggle with `localStorage` persistence and `prefers-color-scheme` fallback
- Canvas particle animation in hero section (respects `prefers-reduced-motion`, pauses when tab hidden)
- Scroll-triggered animations via IntersectionObserver with staggered reveals
- Material 3 Expressive design system with spring-based motion

### Real-Time ASL Recognition
Browser-based computer vision — no server, no data sent externally.
- **Model**: 3-layer MLP (63 → 128 → 64 → 28) trained on ASL hand landmarks, exported to JS
- **Input**: 21 hand landmarks × (x, y, z) = 63 features, using MediaPipe world coordinates
- **Output**: A–Z, Space, Delete (28 classes)
- **Inference**: Runs entirely in-browser with vanilla JS (matMul + ReLU + softmax)
- **Landmark detection**: MediaPipe Hands via CDN

### ASL Dictionary (AI-Powered)
English → ASL sign translation with structured output.
- **Model**: Google Gemini 2.5 Flash (direct browser API call, temperature 0.0)
- **Output**: Per-sign breakdown — gloss, hand shape, location, movement, non-manual markers
- **API key**: User-supplied, stored in `localStorage` — never hardcoded

---

## Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Properties), Vanilla JavaScript (ES6+)
- **AI/ML**: MediaPipe Hands, Google Gemini API
- **Design system**: Material 3 Expressive (custom CSS implementation)
- **Icons**: Font Awesome 6.4
- **Fonts**: Google Sans Flex (local), Fira Code + Outfit (Google Fonts CDN)

---

## Project Structure

```
index.html              # Single-page app — all content
script.js               # All JS logic (~830 lines): UI, theme, particles, ASL demo, dictionary
asl_model.js            # Exported MLP weights + StandardScaler params as JS globals
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

Direct `open index.html` works for basic browsing but will break the ASL demo.

---

## Using the ASL Demo

1. Click **"Try Demo"** on the Real-Time ASL Alphabet Recognition project card
2. Allow camera access when prompted
3. Hold your hand in front of the camera — predictions update in real-time

## Using the ASL Dictionary

1. Click **"Try It"** on the ASL Instruction Generator project card
2. Click **Settings** and enter your [Google Gemini API Key](https://aistudio.google.com/app/apikey)
3. Click **Save**, then type any English word or phrase and hit **Translate**

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
