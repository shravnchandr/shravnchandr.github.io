/**
 * script.js — ES module entry point.
 * Imports each concern from js/*. Nav/hero features initialise as soon as
 * loader.js has injected the critical fragments; section-dependent features
 * initialise once every fragment has settled.
 */

import { initTheme }    from './js/theme.js';
import { initNav, initActiveNav } from './js/nav.js';
import { initScroll, initSectionScroll } from './js/scroll.js';
import { initASL }      from './js/asl.js';
import { initDemo }     from './js/demo.js';
import { initA11yLab }  from './js/a11y.js';
import { initSearch }   from './js/search.js';
import { initWebcam }   from './js/webcam.js';
import { initHeroDemoPlacement } from './js/layout.js';
import { markSectionsReady } from './js/utils.js';

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

function initSections() {
    initActiveNav();
    initSectionScroll();
    initDemo();
    initHeroDemoPlacement();
    markSectionsReady();
}

// loader.js exposes promises that resolve once fragments have settled.
window.__fragments.critical.then(initCore).then(() => window.__fragments.all).then(initSections);
