/**
 * js/utils.js — Shared DOM utility functions.
 *
 * Kept intentionally small. Only add helpers that appear 2+ times
 * across modules. No side effects, no imports.
 */

// Resolved by script.js once section-dependent features (tabs etc.) are wired,
// so early callers (e.g. search, which initialises with the nav) can defer to it.
let _markSectionsReady;
export const sectionsReady = new Promise(r => { _markSectionsReady = r; });
export function markSectionsReady() { _markSectionsReady(); }

/** True when the user has asked the OS for reduced motion. */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Smooth scroll unless the user prefers reduced motion. */
export function scrollToEl(target, block = 'start') {
    target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
}

/**
 * Create a DOM element with an optional className.
 * Avoids repeating document.createElement + el.className in every module.
 *
 * @param {string} tag       HTML tag name
 * @param {string} [cls='']  className string (space-separated)
 * @returns {HTMLElement}
 */
export function el(tag, cls = '') {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
}

/**
 * Create a modal overlay div with standard ARIA attributes.
 * Used by search.js for its overlay:
 * a full-screen backdrop + role="dialog" + aria-hidden="true" on init.
 *
 * @param {string} extraClass   Additional class to add alongside v2-modal-overlay
 * @param {string} ariaLabel    Value for aria-label on the dialog
 * @returns {HTMLElement}
 */
export function makeOverlay(extraClass, ariaLabel) {
    const overlay = el('div', `v2-modal-overlay ${extraClass}`);
    overlay.setAttribute('role',       'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', ariaLabel);
    overlay.setAttribute('aria-hidden', 'true');
    return overlay;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
let _openModal = null;

/** True while any modal created by createModal() is open. */
export function isModalOpen() { return _openModal !== null; }

/**
 * Open/close behaviour for a makeOverlay() dialog, following the W3C APG
 * modal pattern: the rest of the page is made inert while open, Tab is
 * contained inside the dialog, Escape closes it, and focus returns to the
 * element that opened it. Only one modal can be open at a time.
 *
 * @param {HTMLElement} overlay    Element from makeOverlay(), already in the DOM
 * @param {string}      openClass  Class that makes the overlay visible
 * @returns {{open(focusEl?: HTMLElement): void, close(): void, isOpen(): boolean}}
 */
export function createModal(overlay, openClass) {
    let returnFocus = null;
    let inerted = [];
    const isOpen = () => _openModal === overlay;

    function open(focusEl) {
        if (_openModal) return;
        _openModal  = overlay;
        returnFocus = document.activeElement;
        inerted = [...document.body.children].filter(c => c !== overlay && !c.inert);
        inerted.forEach(c => { c.inert = true; });
        overlay.inert = false;
        overlay.classList.add(openClass);
        overlay.setAttribute('aria-hidden', 'false');
        (focusEl || overlay.querySelector(FOCUSABLE))?.focus();
    }

    function close() {
        if (!isOpen()) return;
        _openModal = null;
        inerted.forEach(c => { c.inert = false; });
        inerted = [];
        overlay.classList.remove(openClass);
        overlay.setAttribute('aria-hidden', 'true');
        overlay.inert = true;
        if (returnFocus?.isConnected) returnFocus.focus();
        returnFocus = null;
    }

    overlay.inert = true;   // closed overlays are out of the tab order
    overlay.addEventListener('keydown', e => {
        if (!isOpen()) return;
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key !== 'Tab') return;
        const items = [...overlay.querySelectorAll(FOCUSABLE)];
        if (!items.length) { e.preventDefault(); return; }
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return { open, close, isOpen };
}

/**
 * Build a Top-3 prediction row for the ASL panel.
 * Used by both asl.js (procedural animation) and webcam.js (live classifier)
 * to render rank/letter/confidence rows without duplicating DOM logic.
 *
 * @param {number}  rank    1-based rank index
 * @param {string}  letter  Predicted letter or digit
 * @param {number}  pct     Confidence value in [0, 1]
 * @param {boolean} isTop   Whether this is the top prediction (adds 'top' class)
 * @returns {HTMLElement}
 */
export function makeTop3Row(rank, letter, pct, isTop) {
    const row = el('div', isTop ? 'v2-t3-row top' : 'v2-t3-row');

    const idx = el('span', 'v2-t3-idx');
    idx.textContent = `${rank}.`;

    const ltr = el('span', 'v2-t3-letter');
    ltr.textContent = letter;

    const pctEl = el('span', 'v2-t3-pct');
    pctEl.textContent = `${(pct * 100).toFixed(1)}%`;

    row.append(idx, ltr, pctEl);
    return row;
}

/**
 * Render Top-3 rows into a container, reusing existing row nodes so
 * per-frame updates only touch text instead of rebuilding DOM.
 *
 * @param {HTMLElement|null} container
 * @param {Array<{key: string, conf: number}>} rows
 */
export function renderTop3(container, rows) {
    if (!container) return;
    if (container.children.length !== rows.length) {
        clearEl(container);
        rows.forEach((r, i) => container.appendChild(makeTop3Row(i + 1, r.key, r.conf, i === 0)));
        return;
    }
    rows.forEach((r, i) => {
        const row = container.children[i];
        row.children[1].textContent = r.key;
        row.children[2].textContent = `${(r.conf * 100).toFixed(1)}%`;
    });
}

/**
 * Remove all child nodes from a DOM element.
 * Replaces the repeated `while (el.firstChild) el.removeChild(el.firstChild)`
 * idiom used across asl.js, webcam.js, search.js, a11y.js, and demo.js.
 *
 * @param {HTMLElement} element  The element to empty
 */
export function clearEl(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
}

/**
 * Update the ASL prediction letter display with an M3 spring pop animation.
 * Shared between the procedural cycle (asl.js) and the live webcam classifier
 * (webcam.js) to avoid duplicating the reflow-trigger pattern.
 *
 * @param {HTMLElement|null} letterEl  The letter element to update
 * @param {string}           key       The new letter/digit
 * @param {string}           prevKey   The previously displayed key (or null)
 * @returns {string}  The new prevKey value for the caller to store
 */
export function updateLetterDisplay(letterEl, key, prevKey) {
    if (!letterEl) return prevKey;
    if (key !== prevKey) {
        letterEl.textContent = key;
        letterEl.style.animation = 'none';
        void letterEl.offsetWidth; // force reflow
        letterEl.style.animation = 'm3LetterPop 520ms var(--spring-bounce)';
        return key;
    }
    return prevKey;
}
