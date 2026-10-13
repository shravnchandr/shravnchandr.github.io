/**
 * js/main.js — ES module entry point.
 * Imports each concern from js/*. Nav/hero features initialise as soon as
 * loader.js has injected the critical fragments; section-dependent features
 * initialise once every fragment has settled.
 */

import { initTheme }    from './theme.js';
import { initNav, initActiveNav } from './nav.js';
import { initScroll, initSectionScroll } from './scroll.js';
import { initASL }      from './asl.js';
import { initDemo }     from './demo.js';
import { initA11yLab }  from './a11y.js';
import { initSearch }   from './search.js';
import { initWebcam }   from './webcam.js';
import { initHeroDemoPlacement } from './layout.js';
import { markSectionsReady } from './utils.js';

function initCore() {
    document.getElementById('year').textContent = new Date().getFullYear();

    // Console note — for the engineer who opens DevTools
    console.log(
        '%c S %c Shravan Chandra · Machine Learning Engineer\n\n' +
        '%cHow this page works:\n' +
        '  · plain HTML partials fetched by loader.js — no framework, no build step\n' +
        '  · the ASL classifier (“Try live”) is a small MLP running in your browser: MediaPipe landmarks → softmax\n' +
        '  · the design is a subway signage system: route bullets, line map, one CSS token file\n\n' +
        'Source: github.com/shravnchandr/shravnchandr.github.io · Say hi: schandra.nyc@gmail.com',
        'background:#6d6e71;color:#fff;border-radius:50%;padding:2px 7px;font-weight:700',
        'color:inherit;font-weight:700;font-size:13px',
        'color:inherit;font-size:12px;line-height:1.6'
    );

    initTheme();
    initNav();
    initScroll();
    initASL();
    initA11yLab();
    initSearch();
    initWebcam();
}

// Deep links (/#work, links from the 404 page or LinkedIn): the browser looks for the
// target before loader.js has injected the sections, misses it and stays at the top.
// Once everything is in, jump to it — unless the visitor has already started scrolling.
let _userScrolled = false;
['wheel', 'touchmove', 'keydown'].forEach(ev =>
    window.addEventListener(ev, () => { _userScrolled = true; }, { once: true, passive: true }));

function scrollToHash() {
    if (_userScrolled || location.hash.length < 2) return;
    let target = null;
    try { target = document.querySelector(decodeURIComponent(location.hash)); } catch (_) { return; }
    if (!target) return;
    // Expand a collapsed experience entry, as search does
    const details = target.matches('.v2-tl-item') && target.querySelector('details');
    if (details) details.open = true;
    // A scroll-reveal card starts translated down; show it first so we land on its final spot
    // (without the slide, which would still be moving when we measure)
    if (target.matches('.animate-on-scroll') && !target.classList.contains('show')) {
        target.style.transition = 'none';
        target.classList.add('show');
        void target.offsetWidth;            // apply the final position now
        target.style.transition = '';
    }
    target.scrollIntoView({ block: 'start' });   // instant; scroll-margin-top clears the nav
}

function initSections() {
    initActiveNav();
    initSectionScroll();
    initDemo();
    initHeroDemoPlacement();   // may move the demo card, so scroll after it
    markSectionsReady();
    scrollToHash();
    // Late layout shifts (web font swap, images) can push the target off its mark — re-settle
    document.fonts?.ready.then(() => requestAnimationFrame(scrollToHash));
    if (document.readyState === 'complete') requestAnimationFrame(scrollToHash);
    else window.addEventListener('load', () => requestAnimationFrame(scrollToHash), { once: true });
}

// loader.js exposes promises that resolve once fragments have settled.
window.__fragments.critical.then(initCore).then(() => window.__fragments.all).then(initSections);
