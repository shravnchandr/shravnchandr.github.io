document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initUI();
    initMobileMenu();
    initParticles();
    initASLDemo();
    initASLDictionary();
});

// --- Theme Logic ---
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    const body = document.body;

    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        body.classList.add(savedTheme);
        updateIcon(savedTheme === 'dark-theme');
    } else if (systemPrefersDark) {
        body.classList.add('dark-theme');
        updateIcon(true);
    }

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.replace('dark-theme', 'light-theme');
            localStorage.setItem('theme', 'light-theme');
            updateIcon(false);
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
            updateIcon(true);
        }
    });

    function updateIcon(isDark) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// --- UI Logic ---
function initUI() {
    // Remove no-js class to enable animations
    document.documentElement.classList.remove('no-js');

    // Dynamic Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Scroll Animations (M3 Staggered)
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.animate-on-scroll');
    hiddenElements.forEach(el => observer.observe(el));

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Typewriter Effect
    const typeWriterElement = document.querySelector('.typewriter-text');
    if (typeWriterElement) {
        const textToType = "Senior ML Engineer";
        let typeIndex = 0;

        function typeWriter() {
            if (typeIndex < textToType.length) {
                typeWriterElement.textContent += textToType.charAt(typeIndex);
                typeWriterElement.style.maxWidth = '100%'; // Ensure visibility
                typeIndex++;
                setTimeout(typeWriter, 100); // Typing speed
            }
        }

        // Start typing after a small delay
        setTimeout(() => {
            typeWriterElement.textContent = ''; // Clear existing text
            typeWriter();
        }, 500);
    }
}

// --- Mobile Menu Logic ---
function initMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (!mobileBtn || !navLinks) return;

    const links = navLinks.querySelectorAll('a');
    const icon = mobileBtn.querySelector('i');

    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const isOpen = navLinks.classList.contains('active');

        // Toggle icon
        if (icon) {
            icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
        }

        // Prevent scrolling when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (icon) icon.className = 'fas fa-bars';
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !mobileBtn.contains(e.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            if (icon) icon.className = 'fas fa-bars';
            document.body.style.overflow = '';
        }
    });
}

// --- Particles Logic ---
function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particlesArray;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    // Mouse interaction
    const mouse = {
        x: null,
        y: null,
        radius: 150
    }

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            // Check if particle is within canvas
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Check collision detection - mouse position / particle position
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                    this.x += 10;
                }
                if (mouse.x > this.x && this.x > this.size * 10) {
                    this.x -= 10;
                }
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                    this.y += 10;
                }
                if (mouse.y > this.y && this.y > this.size * 10) {
                    this.y -= 10;
                }
            }

            // Move particle
            this.x += this.directionX;
            this.y += this.directionY;

            this.draw();
        }
    }

    function init() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 3) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 2) - 1; // -1 to 1
            let directionY = (Math.random() * 2) - 1; // -1 to 1

            // Color based on theme (defaulting to a neutral/primary mix)
            let color = getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-primary').trim();

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                    + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

                if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    opacityValue = 1 - (distance / 20000);
                    let color = getComputedStyle(document.body).getPropertyValue('--md-sys-color-primary').trim();

                    ctx.strokeStyle = color;
                    ctx.globalAlpha = opacityValue;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                    ctx.globalAlpha = 1; // Reset
                }
            }
        }
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, innerWidth, innerHeight);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
    }

    // Initialize and animate
    init();
    animateParticles();

    // Re-init particles on theme change to update color
    const observerTheme = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                // Small delay to let CSS variables update
                setTimeout(init, 100);
            }
        });
    });
    observerTheme.observe(document.body, { attributes: true });
}

// --- ASL Demo Logic ---
function initASLDemo() {
    const modal = document.getElementById('asl-modal');
    const openBtn = document.getElementById('open-asl-demo');
    const closeBtn = document.querySelector('.close-modal');
    const videoElement = document.getElementsByClassName('input_video')[0];
    const canvasElement = document.getElementsByClassName('output_canvas')[0];
    const predictionText = document.getElementById('prediction-text');
    const confidenceFill = document.getElementById('confidence-fill');
    const loadingOverlay = document.getElementById('loading');

    if (!modal || !openBtn) return;

    let canvasCtx = null;
    if (canvasElement) {
        canvasCtx = canvasElement.getContext('2d');
    }

    let modelData = null;
    let camera = null;
    let hands = null;
    let isModelLoaded = false;

    // Open Modal
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('show');
        modal.style.display = 'flex';

        if (!isModelLoaded) {
            initASL();
        } else {
            if (camera) camera.start();
        }
    });

    // Close Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            closeModal();
        }
    });

    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        if (camera) {
            videoElement.pause();
        }
    }

    async function initASL() {
        if (isModelLoaded) return;

        try {
            // Check for global ASL data
            if (typeof ASL_MODEL_DATA === 'undefined') {
                throw new Error("ASL_MODEL_DATA not found. Make sure asl_model.js is loaded.");
            }

            modelData = ASL_MODEL_DATA;
            console.log("ASL Model loaded");
            isModelLoaded = true;
            loadingOverlay.style.display = 'none';

            // Initialize MediaPipe
            hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            hands.onResults(onResults);

            camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (modal.style.display !== 'none') {
                        await hands.send({ image: videoElement });
                    }
                },
                width: 1280,
                height: 720
            });

            camera.start();

        } catch (error) {
            console.error("Error initializing ASL:", error);
            if (predictionText) predictionText.innerText = "Error";
            if (loadingOverlay) loadingOverlay.innerHTML = `<p style="color: #ff4444; text-align: center;">Error loading model:<br>${error.message}<br><br>Check console for details.</p>`;
        }
    }

    // Matrix Multiplication Helper
    function matMul(input, weights, bias) {
        const inFeatures = weights.length;
        const outFeatures = weights[0].length;
        const output = new Array(outFeatures).fill(0);

        for (let i = 0; i < outFeatures; i++) {
            output[i] = bias[i];
        }

        for (let i = 0; i < inFeatures; i++) {
            for (let j = 0; j < outFeatures; j++) {
                output[j] += input[i] * weights[i][j];
            }
        }
        return output;
    }

    function relu(input) {
        return input.map(x => Math.max(0, x));
    }

    function softmax(logits) {
        const maxLogit = Math.max(...logits);
        const exps = logits.map(x => Math.exp(x - maxLogit));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sumExps);
    }

    function argMax(array) {
        return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
    }

    function predict(landmarks) {
        if (!modelData) return;
        const scalerData = ASL_SCALER_DATA;

        let flatLandmarks = [];
        for (const lm of landmarks) {
            flatLandmarks.push(lm.x, lm.y, lm.z);
        }

        const scaledInput = flatLandmarks.map((val, idx) => {
            return (val - scalerData.mean[idx]) / scalerData.scale[idx];
        });

        let x = matMul(scaledInput, modelData.model.fc1_w, modelData.model.fc1_b);
        x = relu(x);

        x = matMul(x, modelData.model.fc2_w, modelData.model.fc2_b);
        x = relu(x);

        const logits = matMul(x, modelData.model.fc3_w, modelData.model.fc3_b);

        const probs = softmax(logits);
        const classIdx = argMax(probs);
        const confidence = probs[classIdx];

        let char = '';
        if (classIdx === 26) char = 'DEL';
        else if (classIdx === 27) char = 'SPACE';
        else char = String.fromCharCode(classIdx + 65);

        return { char, confidence };
    }

    function onResults(results) {
        if (!canvasCtx) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];

                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                    { color: '#00FF00', lineWidth: 2 });
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });

                if (results.multiHandWorldLandmarks && results.multiHandWorldLandmarks[i]) {
                    const worldLandmarks = results.multiHandWorldLandmarks[i];
                    const result = predict(worldLandmarks);
                    if (result) {
                        predictionText.innerText = result.char;
                        confidenceFill.style.width = `${result.confidence * 100}%`;
                    }
                }
            }
        } else {
            predictionText.innerText = "-";
            confidenceFill.style.width = "0%";
        }
        canvasCtx.restore();
    }
}

// --- ASL Dictionary Logic ---
function initASLDictionary() {
    const dictModal = document.getElementById('asl-dictionary-modal');
    const openDictBtn = document.getElementById('open-asl-dictionary');
    const closeDictBtn = document.getElementById('close-dictionary-modal');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const saveKeyBtn = document.getElementById('save-api-key');
    const toggleSettingsBtn = document.getElementById('toggle-api-settings');
    const settingsPanel = document.getElementById('api-settings-panel');
    const searchInput = document.getElementById('asl-search-input');
    const searchBtn = document.getElementById('asl-search-btn');
    const resultsContainer = document.getElementById('dictionary-results');
    const dictLoading = document.getElementById('dictionary-loading');

    if (!dictModal || !openDictBtn) return;

    // Load saved API Key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && apiKeyInput) {
        apiKeyInput.value = savedKey;
    }

    // Toggle Settings
    if (toggleSettingsBtn) {
        toggleSettingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('hidden');
        });
    }

    // Save API Key
    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('gemini_api_key', key);
                alert('API Key saved!');
                settingsPanel.classList.add('hidden');
            }
        });
    }

    // Open/Close Modal
    openDictBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dictModal.classList.add('show');
        dictModal.style.display = 'flex';
    });

    if (closeDictBtn) {
        closeDictBtn.addEventListener('click', () => {
            dictModal.classList.remove('show');
            setTimeout(() => {
                dictModal.style.display = 'none';
            }, 300);
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target == dictModal) {
            dictModal.classList.remove('show');
            setTimeout(() => {
                dictModal.style.display = 'none';
            }, 300);
        }
    });

    // Translate Function
    if (searchBtn) {
        searchBtn.addEventListener('click', handleTranslate);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleTranslate();
        });
    }

    async function handleTranslate() {
        const text = searchInput.value.trim();
        const apiKey = localStorage.getItem('gemini_api_key');

        if (!text) return;

        if (!apiKey) {
            alert('Please enter your Google Gemini API Key in the settings.');
            settingsPanel.classList.remove('hidden');
            return;
        }

        // UI State
        resultsContainer.innerHTML = '';
        dictLoading.classList.remove('hidden');
        searchBtn.disabled = true;

        try {
            const prompt = `
                You are an expert ASL lexicographer. Translate the English text "${text}" into a sequence of Standard American Sign Language (ASL) signs.
                Return ONLY a JSON object with this structure:
                {
                    "signs": [
                        {
                            "word": "GLOSS",
                            "hand_shape": "Description",
                            "location": "Description",
                            "movement": "Description",
                            "non_manual_markers": "Description"
                        }
                    ],
                    "note": "Helpful grammar or context note."
                }
            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.0
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error Details:", errorData);
                throw new Error(errorData.error?.message || `API Request Failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const generatedText = data.candidates[0].content.parts[0].text;
            const jsonText = generatedText.replace(/```json|```/g, '').trim();
            const parsedData = JSON.parse(jsonText);

            renderDictionaryResults(parsedData);

        } catch (error) {
            console.error("Dictionary Error:", error);
            resultsContainer.innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}.<br>Check your API Key.</p>`;
        } finally {
            dictLoading.classList.add('hidden');
            searchBtn.disabled = false;
        }
    }

    function renderDictionaryResults(data) {
        if (!data || !data.signs) return;

        data.signs.forEach((sign, index) => {
            const card = document.createElement('div');
            card.className = 'sign-card';
            card.innerHTML = `
                <div class="sign-header">
                    <span class="sign-word">${sign.word.toUpperCase()}</span>
                    <span class="sign-index">Sign ${index + 1}</span>
                </div>
                <div class="sign-details">
                    <div class="detail-item">
                        <span class="detail-label">Hand Shape</span>
                        <span class="detail-value">${sign.hand_shape}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Location</span>
                        <span class="detail-value">${sign.location}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Movement</span>
                        <span class="detail-value">${sign.movement}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">NMM (Face)</span>
                        <span class="detail-value">${sign.non_manual_markers}</span>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(card);
        });

        if (data.note) {
            const note = document.createElement('div');
            note.className = 'note-card';
            note.innerHTML = `<strong>Note:</strong> ${data.note}`;
            resultsContainer.appendChild(note);
        }
    }
}
