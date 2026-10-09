/** tabs.js — Work tab switcher + Story tab + role-nav switcher */

export function initTabs() {
    initWorkTabs();
    initStoryTabs();
}

/**
 * W3C APG tabs keyboard model: only the selected tab is a Tab stop
 * (roving tabindex); ←/→ move between tabs, Home/End jump to the ends.
 * Activation is automatic — moving focus selects the tab.
 */
function wireTablist(tabs, getKey, activate) {
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activate(getKey(tab)));
        tab.addEventListener('keydown', e => {
            let next = null;
            if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
            else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = tabs.length - 1;
            if (next === null) return;
            e.preventDefault();
            activate(getKey(tabs[next]));
            tabs[next].focus();
        });
    });
}

function syncTabs(tabs, getKey, key) {
    tabs.forEach(b => {
        const isActive = getKey(b) === key;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
        b.tabIndex = isActive ? 0 : -1;
    });
}

function initWorkTabs() {
    const tabBtns = [...document.querySelectorAll('#work-tabs .v2-tab')];
    if (!tabBtns.length) return;
    const getKey = b => b.dataset.tab;

    function switchWork(key) {
        syncTabs(tabBtns, getKey, key);
        document.querySelectorAll('[data-tab-panel]').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.tabPanel === key);
        });
    }

    wireTablist(tabBtns, getKey, switchWork);
    switchWork(getKey(tabBtns.find(b => b.classList.contains('active')) || tabBtns[0]));
}

function initStoryTabs() {
    const topBtns  = [...document.querySelectorAll('#story-tabs .v2-tab')];
    const roleBtns = document.querySelectorAll('#role-nav .v2-role-btn');
    if (!topBtns.length) return;
    const getKey = b => b.dataset.story;

    function switchStory(key) {
        syncTabs(topBtns, getKey, key);

        roleBtns.forEach(b => {
            const isActive = b.dataset.role === key;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-pressed', String(isActive));
        });

        document.querySelectorAll('[data-story-panel]').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.storyPanel === key);
        });
    }

    wireTablist(topBtns, getKey, switchStory);

    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => switchStory(btn.dataset.role));
    });

    switchStory(getKey(topBtns.find(b => b.classList.contains('active')) || topBtns[0]));
}
