/**
 * js/utils.js — Shared DOM utility functions.
 *
 * Kept intentionally small. Only add helpers that appear 2+ times
 * across modules. No side effects, no imports.
 */

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
 * Used by search.js and recruiter.js which share the same overlay pattern:
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
    letterEl.textContent = key;
    return prevKey;
}
