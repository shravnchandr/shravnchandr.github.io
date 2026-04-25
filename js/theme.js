/** theme.js — dark-default toggle (dark → light, never back to legacy dark-theme class) */

export function initTheme() {
    const btn  = document.getElementById('theme-toggle');
    const body = document.body;

    if (!btn) return;

    // Dark is default. Only 'light-theme' class is toggled.
    const saved = localStorage.getItem('theme-v2');
    if (saved === 'light') {
        body.classList.add('light-theme');
    }

    updateBtn();

    btn.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        localStorage.setItem('theme-v2', body.classList.contains('light-theme') ? 'light' : 'dark');
        updateBtn();
    });

    function updateBtn() {
        btn.textContent = body.classList.contains('light-theme') ? '☾' : '☀';
        btn.setAttribute('aria-label',
            body.classList.contains('light-theme') ? 'Switch to dark mode' : 'Switch to light mode');
    }
}
