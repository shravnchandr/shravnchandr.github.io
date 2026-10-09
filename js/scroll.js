/** scroll.js — scroll-reveal animations + CountUp + back-to-top + skip link */

import { prefersReducedMotion } from './utils.js';

const COUNTUP_DURATION_MS    = 1400;  // total animation duration for metric count-up
const BACK_TO_TOP_SCROLL_PX  = 300;   // scroll depth at which the back-to-top button appears

/** Persistent UI (index.html) — safe to run before section fragments land. */
export function initScroll() {
    initBackToTop();
    initSkipLink();
}

/** Section-dependent behaviour — run once every fragment has settled. */
export function initSectionScroll() {
    initScrollReveal();
    initCountUp();
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

function initCountUp() {
    if (prefersReducedMotion()) return;   // leave the final values in place
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

            const duration = COUNTUP_DURATION_MS;
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
    let _ticking = false;

    window.addEventListener('scroll', () => {
        if (_ticking) return;
        _ticking = true;
        requestAnimationFrame(() => {
            btn.classList.toggle('visible', window.scrollY > BACK_TO_TOP_SCROLL_PX);
            _ticking = false;
        });
    });

    btn.addEventListener('click', () =>
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
}

// In-page links use native fragment navigation (smooth via `scroll-behavior` in
// base.css), which keeps the URL hash in sync. The skip link additionally moves
// keyboard focus into <main> so the next Tab lands past the navigation.
function initSkipLink() {
    const link = document.querySelector('.skip-link');
    const main = document.getElementById('main-content');
    if (!link || !main) return;

    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    link.addEventListener('click', () => main.focus({ preventScroll: true }));
}
