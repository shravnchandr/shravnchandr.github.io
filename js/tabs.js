/** tabs.js — Work tab switcher + Story tab + role-nav switcher */

export function initTabs() {
    initWorkTabs();
    initStoryTabs();
}

function initWorkTabs() {
    const tabBtns = document.querySelectorAll('#work-tabs .v2-tab');
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.tab;

            tabBtns.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-selected', String(isActive));
            });

            document.querySelectorAll('[data-tab-panel]').forEach(panel => {
                panel.classList.toggle('active', panel.dataset.tabPanel === key);
            });
        });
    });
}

function initStoryTabs() {
    const topBtns  = document.querySelectorAll('#story-tabs .v2-tab');
    const roleBtns = document.querySelectorAll('#role-nav .v2-role-btn');
    if (!topBtns.length) return;

    function switchStory(key) {
        topBtns.forEach(b => {
            const isActive = b.dataset.story === key;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-selected', String(isActive));
        });

        roleBtns.forEach(b => b.classList.toggle('active', b.dataset.role === key));

        document.querySelectorAll('[data-story-panel]').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.storyPanel === key);
        });
    }

    topBtns.forEach(btn => {
        btn.addEventListener('click', () => switchStory(btn.dataset.story));
    });

    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => switchStory(btn.dataset.role));
    });
}
