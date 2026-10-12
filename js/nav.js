/** nav.js — mobile hamburger + active-section highlight */

import { spellSequence } from './asl.js';
import { prefersReducedMotion, setIcon } from './utils.js';

const ICON_OPEN  = 'bars';
const ICON_CLOSE = 'xmark';
const MOBILE_MQ  = '(max-width: 1240px)';  // matches the compact-menu breakpoint in css/nav.css

export function initNav() {
    initMobileMenu();
    initLogoEasterEgg();
}

function initLogoEasterEgg() {
    const logo = document.querySelector('.v2-logo');
    if (!logo) return;
    logo.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        spellSequence(['S','H','R','A','V','A','N']);
    });
}

function initMobileMenu() {
    const btn   = document.getElementById('mobile-menu-btn');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;

    const icon = btn.querySelector('svg.icon');

    function setOpen(open) {
        links.classList.toggle('active', open);
        btn.setAttribute('aria-expanded', String(open));
        setIcon(icon, open ? ICON_CLOSE : ICON_OPEN);
        document.body.style.overflow = open ? 'hidden' : '';
    }
    const isOpen = () => links.classList.contains('active');

    btn.addEventListener('click', () => setOpen(!isOpen()));

    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('click', e => {
        if (isOpen() && !links.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); }
    });

    // Leaving the mobile breakpoint hides the hamburger — drop the menu and its scroll lock.
    window.matchMedia(MOBILE_MQ).addEventListener('change', e => {
        if (!e.matches && isOpen()) setOpen(false);
    });
}

export function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.v2-nav-links a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('id');
            navLinks.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
        });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
}
