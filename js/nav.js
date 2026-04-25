/** nav.js — mobile hamburger + active-section highlight */

import { spellSequence } from './asl.js';

export function initNav() {
    initMobileMenu();
    initActiveNav();
    initLogoEasterEgg();
}

function initLogoEasterEgg() {
    const logo = document.querySelector('.v2-logo');
    if (!logo) return;
    logo.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        spellSequence(['S','H','R','A','V','A','N']);
    });
}

function initMobileMenu() {
    const btn   = document.getElementById('mobile-menu-btn');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;

    const icon = btn.querySelector('i');

    btn.addEventListener('click', () => {
        const open = links.classList.toggle('active');
        btn.setAttribute('aria-expanded', open);
        if (icon) icon.className = open ? 'fas fa-times' : 'fas fa-bars';
        document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => closeMenu());
    });

    // Close on outside click
    document.addEventListener('click', e => {
        if (!links.contains(e.target) && !btn.contains(e.target) && links.classList.contains('active')) {
            closeMenu();
        }
    });

    function closeMenu() {
        links.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        if (icon) icon.className = 'fas fa-bars';
        document.body.style.overflow = '';
    }
}

function initActiveNav() {
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
