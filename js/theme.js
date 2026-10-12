/**
 * theme.js — theme toggle that follows the OS setting by default.
 *
 * The initial theme is applied by an inline script at the top of <body>
 * (index.html) so there is no flash; this module wires the toggle and keeps
 * following the OS while the visitor hasn't made their own choice.
 *
 * localStorage key 'theme-v2': 'light' | 'dark' | absent (= follow the OS).
 * Choosing the theme the OS already uses clears the key, so the page goes
 * back to following the system.
 */

const KEY = 'theme-v2';

export function initTheme() {
    const btn  = document.getElementById('theme-toggle');
    const body = document.body;
    const mq   = window.matchMedia('(prefers-color-scheme: light)');

    // localStorage throws SecurityError in private-browsing / strict-CSP
    // environments; treat that as "no saved choice".
    const saved = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };

    function apply(light) {
        body.classList.toggle('light-theme', light);
        if (btn) {
            // Font Awesome, like every other UI icon
            const icon = document.createElement('i');
            icon.className = light ? 'fas fa-moon' : 'fas fa-sun';
            icon.setAttribute('aria-hidden', 'true');
            btn.replaceChildren(icon);
            btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
        }
    }

    apply(body.classList.contains('light-theme'));

    mq.addEventListener('change', e => { if (!saved()) apply(e.matches); });

    btn?.addEventListener('click', () => {
        const light = !body.classList.contains('light-theme');
        apply(light);
        try {
            if (light === mq.matches) localStorage.removeItem(KEY);
            else localStorage.setItem(KEY, light ? 'light' : 'dark');
        } catch (_) {}
    });
}
