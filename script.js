/**
 * script.js — ES module entry point.
 * Imports each concern from js/*. Nav/hero features initialise as soon as
 * loader.js has injected the critical fragments; section-dependent features
 * initialise once every fragment has settled.
 */

import { initTheme }    from './js/theme.js';
import { initNav, initActiveNav } from './js/nav.js';
import { initScroll, initSectionScroll } from './js/scroll.js';
import { initTabs }     from './js/tabs.js';
import { initASL }      from './js/asl.js';
import { initDemo }     from './js/demo.js';
import { initA11yLab }  from './js/a11y.js';
import { initSearch }   from './js/search.js';
import { initWebcam }   from './js/webcam.js';
import { initRecruiter }from './js/recruiter.js';

function initCore() {
    document.getElementById('year').textContent = new Date().getFullYear();

    // Console Easter egg — for the curious engineer who opens DevTools
    console.log(
        '%c⬡ Portfolio · Shravan Chandra\n%cSenior ML Engineer · shravanc.nyc@gmail.com\n%cStack: TF.js · LangGraph · FastAPI · Gemini 2.5 Flash · MediaPipe\n%cYou found the console. Say hi → github.com/shravnchandr',
        'color:#7c4dff;font-weight:700;font-size:14px;line-height:1.8',
        'color:#a0a9b8;font-size:12px;line-height:1.8',
        'color:#00bfa5;font-size:12px;line-height:1.8',
        'color:#6b7585;font-size:12px;line-height:1.8'
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
    initTabs();
    initDemo();
    initRecruiter();
}

// loader.js exposes promises that resolve once fragments have settled.
window.__fragments.critical.then(initCore).then(() => window.__fragments.all).then(initSections);
