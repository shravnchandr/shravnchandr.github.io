/** scroll.js — scroll-reveal animations + CountUp + back-to-top + smooth scroll */

export function initScroll() {
    initScrollReveal();
    initCountUp();
    initBackToTop();
    initSmoothScroll();
}

function initScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ── CountUp — animates .v2-metric-val numbers when scrolled into view ──
function initCountUp() {
    // Parse "€300K+" → { pre:"€", num:300, suf:"K+", decimals:0 }
    function parse(str) {
        const m = String(str).match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
        if (!m) return null;
        return {
            pre:      m[1],
            num:      parseFloat(m[2]),
            suf:      m[3],
            decimals: (m[2].split('.')[1] || '').length,
            original: str,
        };
    }

    document.querySelectorAll('.v2-metric-val').forEach(el => {
        const parsed = parse(el.textContent.trim());
        if (!parsed) return;

        let started = false;
        const io = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting || started) return;
            started = true;
            io.disconnect();

            const duration = 1400;
            let raf, startTime;

            const step = (t) => {
                if (!startTime) startTime = t;
                const p      = Math.min((t - startTime) / duration, 1);
                const eased  = 1 - Math.pow(1 - p, 3); // easeOutCubic
                const cur    = parsed.num * eased;
                el.textContent = `${parsed.pre}${cur.toFixed(parsed.decimals)}${parsed.suf}`;
                if (p < 1) raf = requestAnimationFrame(step);
                else el.textContent = parsed.original; // ensure exact final value
            };

            raf = requestAnimationFrame(step);
        }, { threshold: 0.4 });

        io.observe(el);
    });
}

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}
