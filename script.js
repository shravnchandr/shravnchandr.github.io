document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initUI();
    initMobileMenu();
    initParticles();
    initBackToTop();
    initActiveNav();
    initProjectFilters();
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

        // Update ARIA attributes
        mobileBtn.setAttribute('aria-expanded', isOpen);

        // Prevent scrolling when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (icon) icon.className = 'fas fa-bars';
            mobileBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !mobileBtn.contains(e.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            if (icon) icon.className = 'fas fa-bars';
            mobileBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
}

// --- Back to Top Button ---
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    const SCROLL_THRESHOLD = 300;

    window.addEventListener('scroll', () => {
        if (window.scrollY > SCROLL_THRESHOLD) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// --- Active Navigation Highlighting ---
function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    if (!sections.length || !navLinks.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');

                // Remove active class from all links
                navLinks.forEach(link => link.classList.remove('active'));

                // Add active class to matching link
                const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

// --- Project Filters ---
function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            // Filter projects
            projectCards.forEach(card => {
                const category = card.dataset.category;

                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'spring-scale-in var(--spring-duration-medium) var(--spring-bounce)';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// --- Particles Logic ---
function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        canvas.style.display = 'none';
        return;
    }

    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let animationId = null;
    let isVisible = true;

    // Configuration constants
    const CONFIG = {
        PARTICLE_DENSITY_DESKTOP: 12000,  // Higher = fewer particles
        PARTICLE_DENSITY_MOBILE: 20000,   // Even fewer on mobile
        MOBILE_BREAKPOINT: 768,
        MOUSE_RADIUS: 150,
        CONNECTION_DISTANCE_FACTOR: 7,
        OPACITY_DIVISOR: 20000,
        PARTICLE_SIZE_MIN: 1,
        PARTICLE_SIZE_MAX: 4,
        MOUSE_REPEL_SPEED: 10,
        PARTICLE_SPEED: 1  // -1 to 1 range
    };

    // Determine if mobile
    const isMobile = () => window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Handle resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        }, 150);
    });

    // Mouse interaction
    const mouse = {
        x: null,
        y: null,
        radius: CONFIG.MOUSE_RADIUS
    };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    // Clear mouse position when leaving window
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
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
            // Bounce off edges
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Mouse collision detection (skip if mouse not in canvas)
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius + this.size) {
                    const repelSpeed = CONFIG.MOUSE_REPEL_SPEED;
                    const boundary = this.size * 10;

                    if (mouse.x < this.x && this.x < canvas.width - boundary) {
                        this.x += repelSpeed;
                    }
                    if (mouse.x > this.x && this.x > boundary) {
                        this.x -= repelSpeed;
                    }
                    if (mouse.y < this.y && this.y < canvas.height - boundary) {
                        this.y += repelSpeed;
                    }
                    if (mouse.y > this.y && this.y > boundary) {
                        this.y -= repelSpeed;
                    }
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
        const density = isMobile() ? CONFIG.PARTICLE_DENSITY_MOBILE : CONFIG.PARTICLE_DENSITY_DESKTOP;
        const numberOfParticles = Math.min((canvas.height * canvas.width) / density, 150); // Cap at 150

        const color = getComputedStyle(document.documentElement)
            .getPropertyValue('--md-sys-color-primary').trim();

        for (let i = 0; i < numberOfParticles; i++) {
            const size = (Math.random() * CONFIG.PARTICLE_SIZE_MAX) + CONFIG.PARTICLE_SIZE_MIN;
            const x = Math.random() * (canvas.width - size * 4) + size * 2;
            const y = Math.random() * (canvas.height - size * 4) + size * 2;
            const directionX = (Math.random() * 2 - 1) * CONFIG.PARTICLE_SPEED;
            const directionY = (Math.random() * 2 - 1) * CONFIG.PARTICLE_SPEED;

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    function connect() {
        const maxDistance = (canvas.width / CONFIG.CONNECTION_DISTANCE_FACTOR) *
                           (canvas.height / CONFIG.CONNECTION_DISTANCE_FACTOR);
        const color = getComputedStyle(document.body)
            .getPropertyValue('--md-sys-color-primary').trim();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                const dx = particlesArray[a].x - particlesArray[b].x;
                const dy = particlesArray[a].y - particlesArray[b].y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < maxDistance) {
                    ctx.globalAlpha = 1 - (distanceSquared / CONFIG.OPACITY_DIVISOR);
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    function animateParticles() {
        if (!isVisible) return;

        animationId = requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
    }

    // Pause animation when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            isVisible = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else {
            isVisible = true;
            if (!animationId) {
                animateParticles();
            }
        }
    });

    // Initialize and animate
    init();
    animateParticles();

    // Re-init particles on theme change to update color
    const observerTheme = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                setTimeout(init, 100);
            }
        });
    });
    observerTheme.observe(document.body, { attributes: true });
}

