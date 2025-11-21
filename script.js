document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Theme Toggle Logic
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
        // No class needed for system default if CSS media query handles it, 
        // but adding class helps with manual toggle logic later
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

    // Particle Network Animation
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
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

    function initParticles() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 3) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 2) - 1; // -1 to 1
            let directionY = (Math.random() * 2) - 1; // -1 to 1

            // Color based on theme (defaulting to a neutral/primary mix)
            // We can check the computed style of a primary color variable to match
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
                    // Handle hex to rgba for opacity
                    // Simple hack: just use the color as is, or assume it's hex and add opacity if needed.
                    // For now, let's just use the primary color with globalAlpha
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
    initParticles();
    animateParticles();

    // Re-init particles on theme change to update color
    const observerTheme = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                // Small delay to let CSS variables update
                setTimeout(initParticles, 100);
            }
        });
    });
    observerTheme.observe(document.body, { attributes: true });

    // --- ASL Recognition Logic ---
    const modal = document.getElementById('asl-modal');
    const openBtn = document.getElementById('open-asl-demo');
    const closeBtn = document.querySelector('.close-modal');
    const videoElement = document.getElementsByClassName('input_video')[0];
    const canvasElement = document.getElementsByClassName('output_canvas')[0];
    const canvasCtx = canvasElement.getContext('2d');
    const predictionText = document.getElementById('prediction-text');
    const confidenceFill = document.getElementById('confidence-fill');
    const loadingOverlay = document.getElementById('loading');

    let modelData = null;
    let camera = null;
    let hands = null;
    let isModelLoaded = false;

    // Open Modal
    if (openBtn) {
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
    }

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
        // Stop camera to save resources
        if (camera) {
            // There is no direct stop() method in MediaPipe Camera Utils 0.3, 
            // but we can stop sending frames or just hide it. 
            // Actually, creating a new Camera instance might be better or just letting it run.
            // For now, we'll leave it running but hidden, or we could try videoElement.pause()
            videoElement.pause();
        }
    }

    async function initASL() {
        if (isModelLoaded) return;

        try {
            // Load Model from embedded data (asl_model.js)
            if (typeof ASL_MODEL_DATA === 'undefined') {
                throw new Error("ASL_MODEL_DATA not found. Make sure asl_model.js is loaded.");
            }

            modelData = ASL_MODEL_DATA;
            console.log("ASL Model loaded from embedded data");
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
            predictionText.innerText = "Error";
            // Show specific error in UI
            loadingOverlay.innerHTML = `<p style="color: #ff4444; text-align: center;">Error loading model:<br>${error.message}<br><br>Check console for details.</p>`;
        }
    }

    // Matrix Multiplication Helper
    function matMul(input, weights, bias) {
        const outFeatures = weights.length;
        const inFeatures = weights[0].length;
        const output = new Array(outFeatures).fill(0);

        for (let i = 0; i < outFeatures; i++) {
            let sum = 0;
            for (let j = 0; j < inFeatures; j++) {
                sum += input[j] * weights[i][j];
            }
            output[i] = sum + bias[i];
        }
        return output;
    }

    // ReLU Activation
    function relu(input) {
        return input.map(x => Math.max(0, x));
    }

    // Softmax
    function softmax(logits) {
        const maxLogit = Math.max(...logits);
        const exps = logits.map(x => Math.exp(x - maxLogit));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sumExps);
    }

    // Argmax
    function argMax(array) {
        return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
    }

    // Inference Function
    function predict(landmarks) {
        if (!modelData) return;

        // 1. Preprocess: Flatten and Scale
        let flatLandmarks = [];
        for (const lm of landmarks) {
            flatLandmarks.push(lm.x, lm.y, lm.z);
        }

        // Standard Scaler Transform: (x - mean) / scale
        const scaledInput = flatLandmarks.map((val, idx) => {
            return (val - modelData.scaler.mean[idx]) / modelData.scaler.scale[idx];
        });

        // 2. Forward Pass
        // Layer 1: Linear -> ReLU
        let x = matMul(scaledInput, modelData.model.fc1_w, modelData.model.fc1_b);
        x = relu(x);

        // Layer 2: Linear -> ReLU
        x = matMul(x, modelData.model.fc2_w, modelData.model.fc2_b);
        x = relu(x);

        // Layer 3: Linear
        const logits = matMul(x, modelData.model.fc3_w, modelData.model.fc3_b);

        // 3. Post-process
        const probs = softmax(logits);
        const classIdx = argMax(probs);
        const confidence = probs[classIdx];

        // Map to Character
        let char = '';
        if (classIdx === 26) char = 'DEL';
        else if (classIdx === 27) char = 'SPACE';
        else char = String.fromCharCode(classIdx + 65); // 0 -> 'A'

        return { char, confidence };
    }

    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];

                // Draw with thinner lines and dots
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                    { color: '#00FF00', lineWidth: 2 });
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });

                // Run Prediction using World Landmarks (if available)
                // The model was trained on world landmarks (meters), not normalized screen coordinates.
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
});
