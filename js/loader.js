/**
 * loader.js — async HTML-fragment injector for the v2 static site.
 *
 * Each section lives in html/<name>.html.  All fragments are fetched in
 * parallel.  Each fetch retries up to MAX_RETRIES times with exponential
 * backoff before giving up.  Critical sections (nav) render a visible
 * error notice on permanent failure; non-critical sections are silently
 * omitted so the rest of the page still loads.
 *
 * Every attempt has a timeout, so a stalled request can't hang the page.
 * The page is revealed as soon as the critical fragments settle — below-fold
 * placeholders keep showing their skeletons until their own fetch settles.
 *
 * Exposes two promises for js/main.js:
 *   window.__fragments.critical — nav + hero settled (loaded or failed)
 *   window.__fragments.all      — every fragment settled
 */

// Asset version: bump with index.html and css/main.css whenever CSS changes,
// so a returning visitor's cache can't pair new HTML with old CSS.
const ASSET_VERSION = '2026101301';

const FRAGMENTS = [
    { id: 'frag-nav',      src: 'html/nav.html',      critical: true  },
    { id: 'frag-hero',     src: 'html/hero.html',     critical: true  },
    { id: 'frag-impact',   src: 'html/impact.html',   critical: false },
    { id: 'frag-story',    src: 'html/story.html',    critical: false },
    { id: 'frag-work',     src: 'html/work.html',     critical: false },
    { id: 'frag-research', src: 'html/research.html', critical: false },
    { id: 'frag-demo',     src: 'html/demo.html',     critical: false },
    { id: 'frag-stack',    src: 'html/stack.html',    critical: false },
    { id: 'frag-now',      src: 'html/now.html',      critical: false },
    { id: 'frag-contact',  src: 'html/contact.html',  critical: false },
];

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 400;
const ATTEMPT_TIMEOUT_MS = 6000;

async function fetchWithRetry(src, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        // Network errors and non-2xx responses are both real failure modes for a static
        // file fetch (offline, CDN hiccup, deploy race). Retry with exponential backoff;
        // re-throw on the final attempt so loadFragment() can decide how to handle it.
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ATTEMPT_TIMEOUT_MS);
        try {
            const res = await fetch(`${src}?v=${ASSET_VERSION}`, { signal: ctrl.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
        } finally {
            clearTimeout(timer);
        }
    }
}

async function loadFragment({ id, src, critical }) {
    const placeholder = document.getElementById(id);
    if (!placeholder) return;

    // fetchWithRetry throws only after MAX_RETRIES attempts — a genuine permanent failure.
    // Critical sections (nav, hero) must show a visible error message; non-critical sections
    // are silently removed so the rest of the page still renders. Propagating this error
    // further would stall Promise.all and leave body.loading permanently set.
    try {
        const html = await fetchWithRetry(src);
        placeholder.outerHTML = html;
    } catch (err) {
        console.error(`[loader] Failed to load ${src} after ${MAX_RETRIES} retries:`, err);

        if (critical) {
            placeholder.style.cssText =
                'padding:20px;text-align:center;color:#a0a9b8;font-family:monospace;font-size:13px';
            placeholder.textContent = `⚠ Failed to load section (${src}). Please refresh.`;
        } else {
            placeholder.remove();
        }
    }
}

function bootstrap() {
    const loads    = FRAGMENTS.map(f => ({ f, done: loadFragment(f) }));
    const critical = Promise.all(loads.filter(l => l.f.critical).map(l => l.done))
        .then(() => document.body.classList.remove('loading'));
    const all      = Promise.all(loads.map(l => l.done));
    window.__fragments = { critical, all };
}

// The deployed page is pre-built (dev/build.py writes every section into index.html),
// so there are no placeholders and nothing to fetch. Locally, the repo's index.html
// still has them, and the sections load at runtime as before.
if (FRAGMENTS.some(f => document.getElementById(f.id))) {
    document.body.classList.add('loading');
    bootstrap();
} else {
    window.__fragments = { critical: Promise.resolve(), all: Promise.resolve() };
}
