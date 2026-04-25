/** tabs.js — Work tab switcher + Story tab + role-nav switcher */

export function initTabs() {
    initWorkTabs();
    initStoryTabs();
}

// ── Work section ──────────────────────────────────────────────
function initWorkTabs() {
    const tabBtns = document.querySelectorAll('#work-tabs .v2-tab');
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.tab;

            // Update tab buttons
            tabBtns.forEach(b => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-selected', b === btn);
            });

            // Update panels
            document.querySelectorAll('[data-tab-panel]').forEach(panel => {
                panel.classList.toggle('active', panel.dataset.tabPanel === key);
            });
        });
    });
}

// ── Story section ─────────────────────────────────────────────
function initStoryTabs() {
    const topBtns  = document.querySelectorAll('#story-tabs .v2-tab');
    const roleBtns = document.querySelectorAll('#role-nav .v2-role-btn');
    if (!topBtns.length) return;

    function switchStory(key) {
        // Top tabs
        topBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.story === key);
            b.setAttribute('aria-selected', b.dataset.story === key);
        });

        // Role-nav buttons (right column)
        roleBtns.forEach(b => b.classList.toggle('active', b.dataset.role === key));

        // Content panels
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
