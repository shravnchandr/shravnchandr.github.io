/**
 * js/search.js — Portfolio semantic search (keyword-based).
 *
 * Opens with ⌘K / Ctrl+K or the #search-trigger button in the nav.
 * Tokenises the query and scores against a pre-built index of projects,
 * experience, and education. Selecting a result scrolls to the right
 * section and activates the correct tab.
 *
 * Matching rules (no w.includes(t) — avoids false positives where a
 * short token like "ecu" fires on query words like "because"):
 *   exact match   → token.length ≥ 5 ? +5 : ≥ 3 ? +3 : +1
 *   prefix match  → query word is prefix of token, len ≥ 3 → +2
 *   substr match  → query word is substring of token, len ≥ 3 → +1
 */

/* ── Stop words (filtered before matching) ─────────────────────────── */
const _STOP = new Set([
    'is','in','at','to','for','of','or','and','the','my','me','i','a','an',
    'was','be','been','by','on','with','from','into','as','up','it','its',
    'did','do','how','what','show','give','find','tell','help','me','us',
    'did','using','used','built','led','had','has','have','did','made',
]);

/* ── Search index ──────────────────────────────────────────────────── */
const INDEX = [
    // ── Projects ───────────────────────────────────────────────────────
    {
        type:  'project',
        id:    'asl-guide',
        label: 'ASL Guide',
        sub:   'LangGraph · TF.js · MediaPipe · FastAPI · Redis · PWA',
        icon:  '★',
        tokens: [
            'asl','guide','sign','language','fingerspell','fingerspelling',
            'tensorflow','tfjs','mediapipe','fastapi','react','redis',
            'langgraph','docker','postgresql','postgres',
            'pwa','service','worker','offline','progressive',
            'spaced','repetition','sm2','sm','duolingo',
            'gemini','google','geminiflash','knowledge','base',
            'grammar','rules','grammar rules',
            'classifier','recognition','prediction','inference',
            'camera','live','browser','landmark','landmarks','21',
            '95.5','36','10','accessibility',
            'production','platform','learning','dictionary',
            'kl','divergence',  // Grammar Agent uses KL-like probabilistic reasoning
        ],
        action() { _selectTab('[data-tab="asl-guide"]', '#work'); },
    },
    {
        type:  'project',
        id:    'retinopathy',
        label: 'Diabetic Retinopathy Classifier',
        sub:   'Keras · Xception · Grad-CAM · Healthcare · 96% Kappa',
        icon:  '◉',
        tokens: [
            'retinopathy','diabetic','fundus','kappa','96',
            'xception','gradcam','grad','cam','interpretability','explainability',
            'clinical','healthcare','medical','health','eye','disease','diagnosis',
            'keras','opencv','cnn','convolution','convolutional',
            'vision','computer','cv','imaging','classification','lesion',
            'kaggle','dataset','benchmark',
        ],
        action() { _selectTab('[data-tab="retinopathy"]', '#work'); },
    },
    {
        type:  'project',
        id:    'temporal-asl',
        label: 'Sign-Language Temporal Modeling',
        sub:   'PyTorch · CNN + Transformer · MS-ASL200 · 80.85%',
        icon:  '◎',
        tokens: [
            'temporal','modeling','sequence','video',
            'ms','msaml','msaml200','ms-asl','ms-asl200','200',
            'cnn','transformer','attention','architecture',
            'pytorch','scaling','scale','dataset',
            '80','80.85','signs','top1','accuracy','research',
            'asl','sign','language','recognition',
        ],
        action() { _selectTab('[data-tab="temporal-asl"]', '#work'); },
    },
    {
        type:  'project',
        id:    'iccar',
        label: 'IEEE ICCAR 2022 Publication',
        sub:   'MediaPipe · XGBoost · Dynamic Sign Language · Research',
        icon:  '◇',
        tokens: [
            'ieee','iccar','2022','publication','paper','published','doi',
            'xgboost','mediapipe','dynamic','static',
            'research','sign','language','recognition',
            '90','15','phrases','gesture',
            'computer','vision','cv',
        ],
        action() { _selectTab('[data-tab="iccar"]', '#work'); },
    },

    // ── Experience ─────────────────────────────────────────────────────
    {
        type:  'story',
        id:    'bosch-sr',
        label: 'Senior ML Engineer — Bosch',
        sub:   'Autoencoder · Anomaly Detection · Azure · Power BI · Mentoring',
        icon:  '⚙',
        tokens: [
            'bosch','senior','current','present','2025',
            'autoencoder','anomaly','anomaly detection','detection',
            'predictive','maintenance','pipeline','production',
            'cycles','testing','saving','savings',
            '300k','300','4 months','months',
            'azure','power','powerbi','bi',
            'observability','infra','infrastructure','debug','turnaround','40',
            'ecu','ecus','models','global','users','50',
            'spoc','automation','initiatives','india','germany','china',
            'mentor','mentoring','mentored','interns','internship',
            'machine','learning','engineer',
        ],
        action() { _selectTab('[data-story="bosch-sr"]', '#story'); },
    },
    {
        type:  'story',
        id:    'bosch-ml',
        label: 'ML Engineer — Bosch',
        sub:   'TF 1.x → PyTorch · 48% faster · KL divergence drift · Power BI',
        icon:  '⚙',
        tokens: [
            'bosch','ml','2023','2024',
            'migration','tf','tf1.x','tensorflow','pytorch',
            '48','faster','training','train','speed',
            'azure','gpu','cloud',
            'drift','detection','kl','divergence','distribution',
            'sensor','sensors','accuracy','95',
            'dashboard','dashboards','powerbi','power bi','power','bi',
            'ecu','ecus','100','distributed','engineering','teams',
            'machine','learning','engineer',
        ],
        action() { _selectTab('[data-story="bosch-ml"]', '#story'); },
    },
    {
        type:  'story',
        id:    'bosch-swe',
        label: 'Software Developer — Bosch',
        sub:   'Automation Tools · Flask · PCB Pricing · Automotive Test Data',
        icon:  '⚙',
        tokens: [
            'bosch','software','developer','2021','2023',
            'automation','automated','tools','gui','guis',
            '45','manual','data','analysis','analysts','engineers','25',
            'pcb','pricing','accuracy','30','processing','time','90','5',
            'flask','apps','application','automotive',
            'test','visualization','visualize',
        ],
        action() { _selectTab('[data-story="bosch-swe"]', '#story'); },
    },
    {
        type:  'story',
        id:    'goldman',
        label: 'Goldman Sachs — Junior Analyst',
        sub:   'Trade Booking Automation · Finance · Python · 65% faster',
        icon:  '♦',
        tokens: [
            'goldman','sachs','gs',
            'junior','analyst','finance','banking','financial','bank',
            'trade','trading','booking','verification','bookings',
            '65','faster','automated','automation',
            'python','script','2021',
        ],
        action() { _selectTab('[data-story="goldman"]', '#story'); },
    },
    {
        type:  'story',
        id:    'education',
        label: 'PES University — BTech EEE',
        sub:   'Electrical & Electronics · CGPA 8.5 · 2017–2021',
        icon:  '◆',
        tokens: [
            'pes','university','btech','btech','degree',
            'electrical','electronics','eee',
            'cgpa','gpa','8.5','grade',
            '2017','2021','graduation','undergraduate','college',
            'bengaluru','bangalore',
        ],
        action() {
            const section = document.querySelector('#story');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
    },
];

/* ── State ─────────────────────────────────────────────────────────── */
let _overlay = null;
let _input   = null;
let _results = null;
let _active  = -1;

/* ── Public init ───────────────────────────────────────────────────── */
export function initSearch() {
    _buildOverlay();

    // ⌘K / Ctrl+K
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            _open();
        }
        if (e.key === 'Escape' && _overlay.classList.contains('v2-search-overlay--open')) {
            _close();
        }
    });

    const trigger = document.getElementById('search-trigger');
    if (trigger) trigger.addEventListener('click', _open);
}

/* ── Overlay DOM ───────────────────────────────────────────────────── */
function _buildOverlay() {
    _overlay = _el('div', 'v2-search-overlay');
    _overlay.setAttribute('role', 'dialog');
    _overlay.setAttribute('aria-modal', 'true');
    _overlay.setAttribute('aria-label', 'Portfolio search');
    _overlay.setAttribute('aria-hidden', 'true');

    const modal = _el('div', 'v2-search-modal');

    const row  = _el('div', 'v2-search-row');
    const ico  = _el('i', 'fas fa-search v2-search-icon');
    ico.setAttribute('aria-hidden', 'true');

    _input = _el('input', 'v2-search-input');
    _input.type        = 'text';
    _input.placeholder = 'Search portfolio… try "autoencoder", "PyTorch migration", or "trade booking"';
    _input.setAttribute('autocomplete', 'off');
    _input.setAttribute('spellcheck',   'false');
    _input.setAttribute('aria-label',   'Search query');
    _input.setAttribute('aria-autocomplete', 'list');
    _input.setAttribute('aria-controls',     'search-results-list');

    const esc  = _el('kbd', 'v2-search-esc');
    esc.textContent = 'ESC';

    row.appendChild(ico);
    row.appendChild(_input);
    row.appendChild(esc);
    modal.appendChild(row);

    _results = _el('div', 'v2-search-results');
    _results.setAttribute('role', 'listbox');
    _results.id = 'search-results-list';
    modal.appendChild(_results);

    _overlay.appendChild(modal);
    document.body.appendChild(_overlay);

    _overlay.addEventListener('click', e => { if (e.target === _overlay) _close(); });
    _input.addEventListener('input',   _onInput);
    _input.addEventListener('keydown', _onKeyDown);
}

function _onInput() {
    const q = _input.value.trim();
    _active = -1;
    if (!q) { _showTips(); return; }
    _renderResults(_query(q), q);
}

function _onKeyDown(e) {
    const items = _results.querySelectorAll('.v2-search-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        _active = Math.min(_active + 1, items.length - 1);
        _updateCursor(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _active = Math.max(_active - 1, 0);
        _updateCursor(items);
    } else if (e.key === 'Enter' && _active >= 0) {
        e.preventDefault();
        items[_active]?.click();
    }
}

function _updateCursor(items) {
    items.forEach((el, i) => el.classList.toggle('v2-search-item--active', i === _active));
    items[_active]?.scrollIntoView({ block: 'nearest' });
}

/* ── Query engine ──────────────────────────────────────────────────── */
function _query(raw) {
    // Normalise: strip currency symbols, split on whitespace/hyphens/slashes/dots
    const words = raw.toLowerCase()
        .replace(/[€$£]/g, '')
        .replace(/[+%,!?]/g, ' ')
        .split(/[\s\-\/\.]+/)
        .map(w => w.replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length >= 2 && !_STOP.has(w));

    if (!words.length) return [];

    return INDEX
        .map(item => {
            let score = 0;
            words.forEach(w => {
                item.tokens.forEach(t => {
                    if (t === w) {
                        // Exact match — reward specificity: longer tokens are rarer
                        score += t.length >= 5 ? 5 : t.length >= 3 ? 3 : 1;
                    } else if (w.length >= 3 && t.startsWith(w)) {
                        // Query word is a prefix of the token
                        score += 2;
                    } else if (w.length >= 3 && t.includes(w)) {
                        // Query word is a substring of the token (e.g. "lang" → "langgraph")
                        score += 1;
                    }
                    // INTENTIONALLY NO w.includes(t): that direction causes false positives
                    // (e.g. token "ecu" matching query word "because", token "ml" matching "email")
                });
            });
            return { item, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 7)
        .map(({ item }) => item);
}

/* ── Rendering ─────────────────────────────────────────────────────── */
function _renderResults(hits, query) {
    while (_results.firstChild) _results.removeChild(_results.firstChild);

    if (!hits.length) {
        const empty = _el('div', 'v2-search-empty');
        empty.textContent = `No matches for "${query}" — try "autoencoder", "drift detection", "flask", or "ieee"`;
        _results.appendChild(empty);
        return;
    }

    const groups = { project: [], story: [] };
    hits.forEach(h => groups[h.type].push(h));

    [['project', 'Projects'], ['story', 'Experience & Education']].forEach(([type, label]) => {
        if (!groups[type].length) return;

        const hdr = _el('div', 'v2-search-group-hdr');
        hdr.textContent = label;
        _results.appendChild(hdr);

        groups[type].forEach(item => {
            const el  = _el('div', 'v2-search-item');
            el.setAttribute('role', 'option');
            el.setAttribute('tabindex', '-1');

            const ico  = _el('span', 'v2-search-item-ico');
            ico.textContent = item.icon;

            const body = _el('div', 'v2-search-item-body');
            const lbl  = _el('div', 'v2-search-item-label');
            lbl.textContent = item.label;
            const sub  = _el('div', 'v2-search-item-sub');
            sub.textContent = item.sub;
            body.appendChild(lbl);
            body.appendChild(sub);

            el.appendChild(ico);
            el.appendChild(body);
            el.addEventListener('click', () => { _close(); item.action(); });
            _results.appendChild(el);
        });
    });
}

function _showTips() {
    while (_results.firstChild) _results.removeChild(_results.firstChild);

    const tip = _el('div', 'v2-search-tip');
    const lines = [
        '"autoencoder anomaly detection"',
        '"PyTorch migration 48%"',
        '"spaced repetition"',
        '"PCB pricing Flask"',
        '"trade booking Goldman"',
        '"IEEE ICCAR 2022"',
    ];
    lines.forEach(line => {
        const p = _el('p');
        p.textContent = line;
        tip.appendChild(p);
    });
    _results.appendChild(tip);
}

/* ── Open / close ──────────────────────────────────────────────────── */
function _open() {
    _overlay.classList.add('v2-search-overlay--open');
    _overlay.setAttribute('aria-hidden', 'false');
    _input.value = '';
    _active = -1;
    _showTips();
    requestAnimationFrame(() => _input.focus());
}

function _close() {
    _overlay.classList.remove('v2-search-overlay--open');
    _overlay.setAttribute('aria-hidden', 'true');
}

/* ── Helpers ───────────────────────────────────────────────────────── */
function _selectTab(selector, sectionId) {
    document.querySelector(selector)?.click();
    document.querySelector(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _el(tag, className = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
}
