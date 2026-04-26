/**
 * js/a11y.js — Accessibility Lab mode.
 *
 * Adds body.a11y-lab when the toggle (#a11y-lab-btn) is pressed.
 * CSS outlines in css/a11y.css highlight ARIA landmarks, labeled
 * elements, and live regions.
 *
 * Also builds and shows a side panel (#a11y-panel) listing the
 * accessibility design decisions behind this portfolio.
 */

import { el as _el } from './utils.js';

const FEATURES = [
    {
        icon: 'fas fa-route',
        accent: 'inference',
        title: 'ARIA landmarks',
        note: 'nav, main, and section[aria-label] give screen readers a named page map — users jump between sections with a single keystroke.',
    },
    {
        icon: 'fas fa-tag',
        accent: 'data',
        title: 'Descriptive labels',
        note: 'Every icon button carries aria-label so VoiceOver / NVDA announces intent ("Toggle theme"), not just "button".',
    },
    {
        icon: 'fas fa-wifi',
        accent: 'neural',
        title: 'Live regions',
        note: 'aria-live="polite" on the ASL prediction panel — the letter is announced after the current utterance, never interrupting.',
    },
    {
        icon: 'fas fa-wind',
        accent: 'inference',
        title: 'Reduced-motion fallback',
        note: '@media (prefers-reduced-motion: reduce) disables every spring keyframe and CSS transition — no exceptions, no overrides.',
    },
    {
        icon: 'fas fa-circle-half-stroke',
        accent: 'data',
        title: 'WCAG-AA contrast',
        note: 'v2-text on v2-bg: 12.3 : 1. v2-text-dim on v2-surface: 5.1 : 1. Both exceed the 4.5 : 1 AA minimum.',
    },
    {
        icon: 'fas fa-keyboard',
        accent: 'neural',
        title: 'Keyboard & skip nav',
        note: 'Tab reveals a skip-to-main link. role="menubar" on the pill nav. Focus-visible ring on every interactive element.',
    },
];

const LEGEND = [
    { color: 'var(--v2-inference)', label: 'ARIA role / landmark' },
    { color: 'var(--v2-data)',      label: 'aria-label' },
    { color: 'var(--v2-neural)',    label: 'aria-live region' },
];

export function initA11yLab() {
    const btn   = document.getElementById('a11y-lab-btn');
    const panel = document.getElementById('a11y-panel');
    if (!btn || !panel) return;

    _buildPanel(panel);

    function setActive(on) {
        document.body.classList.toggle('a11y-lab', on);
        btn.setAttribute('aria-pressed', String(on));
        panel.classList.toggle('v2-a11y-panel--open', on);
        panel.setAttribute('aria-hidden', String(!on));
        try { localStorage.setItem('a11y-lab', on ? '1' : '0'); } catch (_) {}
    }

    btn.addEventListener('click', () => {
        setActive(!document.body.classList.contains('a11y-lab'));
    });

    panel.querySelector('.v2-a11y-close').addEventListener('click', () => setActive(false));

    try {
        if (localStorage.getItem('a11y-lab') === '1') setActive(true);
    } catch (_) {}
}

function _buildPanel(panel) {
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    const hdr   = _el('div',    'v2-a11y-hdr');
    const title = _el('span',   'v2-a11y-title');
    title.textContent = '⬡ Accessibility Lab';
    const close = _el('button', 'v2-panel-close v2-a11y-close');
    close.setAttribute('aria-label', 'Close Accessibility Lab');
    close.textContent = '×';
    hdr.appendChild(title);
    hdr.appendChild(close);
    panel.appendChild(hdr);

    const legend    = _el('div', 'v2-a11y-legend');
    const legHeader = _el('p',   'v2-a11y-legend-title');
    legHeader.textContent = 'HIGHLIGHT KEY';
    legend.appendChild(legHeader);
    LEGEND.forEach(({ color, label }) => {
        const row = _el('div',  'v2-a11y-legend-row');
        const dot = _el('span', 'v2-a11y-dot');
        dot.style.background = color;
        const lbl = _el('span');
        lbl.textContent = label;
        row.appendChild(dot);
        row.appendChild(lbl);
        legend.appendChild(row);
    });
    panel.appendChild(legend);

    const list = _el('ul', 'v2-a11y-list');
    FEATURES.forEach(({ icon, accent, title: featureTitle, note }) => {
        const li   = _el('li',  'v2-a11y-item');
        const ico  = _el('i',   `${icon} v2-a11y-ico v2-a11y-ico--${accent}`);
        ico.setAttribute('aria-hidden', 'true');
        const body = _el('div', 'v2-a11y-body');
        const ttl  = _el('strong');
        ttl.textContent = featureTitle;
        const nt   = _el('p');
        nt.textContent = note;
        body.appendChild(ttl);
        body.appendChild(nt);
        li.appendChild(ico);
        li.appendChild(body);
        list.appendChild(li);
    });
    panel.appendChild(list);
}

