# Shravan Chandra | Senior ML Engineer - Portfolio

Welcome to the source code of my personal portfolio website. This project showcases my professional experience, skills, and projects in Machine Learning and Software Engineering. It features a modern, responsive design with interactive elements and integrated AI demonstrations.

## 🚀 Features

### 🎨 Modern UI/UX
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices.
- **Theme System**: Toggle between Dark and Light modes with preference persistence (localStorage).
- **Interactive Background**: Custom particle animation system on the hero section.
- **Animations**: Smooth scroll animations and staggered reveal effects using Intersection Observer.

### 👐 Real-Time ASL Recognition
A browser-based Computer Vision application integrated directly into the portfolio.
- **Tech**: MediaPipe Hands (for landmark detection) + Custom PyTorch Model (converted to run in JS).
- **Functionality**: Recognizes American Sign Language (ASL) alphabets (A-Z), Space, and Delete in real-time via webcam.
- **Privacy**: All processing happens locally in the browser; no video data is sent to a server.

### 📖 ASL Dictionary (AI-Powered)
An intelligent dictionary that translates English words into ASL descriptions.
- **Tech**: Google Gemini API.
- **Functionality**: Users can search for a word, and the system prompts Gemini to provide a structured description of the ASL sign (Hand Shape, Location, Movement, Non-Manual Markers).
- **Configuration**: Requires a Google Gemini API Key (stored locally in the browser).

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Custom Properties/Variables), JavaScript (ES6+).
- **AI/ML**:
    - [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
    - [Google Gemini API](https://ai.google.dev/)
- **Icons**: FontAwesome 6.
- **Fonts**: Google Fonts (Fira Code, Outfit).

## 📂 Project Structure

```
.
├── index.html          # Main entry point
├── script.js           # Core logic (UI, Theme, ASL Demo, ASL Dictionary)
├── asl_model.js        # Pre-trained ASL model weights (JSON format)
├── css/                # Stylesheets
│   ├── main.css        # Main import file
│   ├── variables.css   # CSS Variables (Colors, Fonts)
│   ├── base.css        # Reset and Typography
│   ├── layout.css      # Grid and Layout utilities
│   ├── animations.css  # Keyframes and Transitions
│   ├── components/     # UI Components (Buttons, Cards, Modals, etc.)
│   └── sections/       # Page Sections (Hero, Skills, Experience, etc.)
└── assets/             # Images and static assets
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari).
- A webcam (for ASL Recognition).
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (for ASL Dictionary).

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/shravnchandr/shravnchandr.github.io.git
    cd shravnchandr.github.io
    ```

2.  **Run Locally**:
    - Since this is a static site, you can simply open `index.html` in your browser.
    - **Recommended**: Use a local development server to avoid CORS issues with some browser features.
        - VS Code: Right-click `index.html` -> "Open with Live Server".
        - Python: `python3 -m http.server` -> Open `http://localhost:8000`.

### Usage

#### ASL Recognition Demo
1.  Click the **"Try Demo"** button on the "Real-Time ASL Alphabet Recognition" project card.
2.  Allow camera access when prompted.
3.  Show your hand to the camera to see real-time predictions.

#### ASL Dictionary
1.  Click the **"Open Dictionary"** button on the "ASL Dictionary (AI)" project card.
2.  Click **"Settings"** and enter your Google Gemini API Key.
3.  Click **"Save"**.
4.  Enter a word (e.g., "Hello") and click **"Translate"**.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
*Designed and Developed by Shravan Chandra.*
