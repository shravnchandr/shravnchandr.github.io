/** theme.js — dark-default toggle (dark → light, never back to legacy dark-theme class) */

export function initTheme() {
    const btn  = document.getElementById('theme-toggle');
    const body = document.body;

    if (!btn) return;

    try {
        if (localStorage.getItem('theme-v2') === 'light') body.classList.add('light-theme');
    } catch (_) {}

    updateBtn();

    btn.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        try {
            localStorage.setItem('theme-v2', body.classList.contains('light-theme') ? 'light' : 'dark');
        } catch (_) {}
        updateBtn();
    });

    function updateBtn() {
        btn.textContent = body.classList.contains('light-theme') ? '☾' : '☀';
        btn.setAttribute('aria-label',
            body.classList.contains('light-theme') ? 'Switch to dark mode' : 'Switch to light mode');
    }
}
