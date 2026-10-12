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

import { el as _el, makeOverlay, clearEl, createModal, isModalOpen, scrollToEl, sectionsReady } from './utils.js';

/* ── Stop words (filtered before matching) ─────────────────────────── */
const _STOP = new Set([
    'is','in','at','to','for','of','or','and','the','my','me','i','a','an',
    'was','be','been','by','on','with','from','into','as','up','it','its',
    'did','do','how','what','show','give','find','tell','help','me','us',
    'did','using','used','built','led','had','has','have','did','made',
]);

/* ── Search index ──────────────────────────────────────────────────── */
const INDEX = [
    {
        type:  'project',
        id:    'asl-guide',
        label: 'ASL Guide',
        sub:   'LangGraph · TF.js · MediaPipe · FastAPI · Redis · PWA',
        route: ['A', 'yellow'],   // route bullet shown in results
        tokens: [
            'project','work','case','study','studies','portfolio',  // section words
            'asl','guide','sign','language','fingerspell','fingerspelling',
            'tensorflow','tfjs','mediapipe','fastapi','react','redis',
            'langgraph','docker','postgresql','postgres',
            'pwa','service','worker','offline','progressive',
            'spaced','repetition','sm2','sm','duolingo',
            'gemini','google','geminiflash','knowledge','base',
            'grammar','rules','grammar rules',
            'classifier','recognition','prediction','inference',
            'camera','live','browser','landmark','landmarks','21',
            '95.5','36','11','accessibility',
            'production','platform','learning','dictionary',
            'kl','divergence',
            'agent','agents','agentic','multiagent','multi',
            'llm','llms','large','model','models',
            'genai','generative','ai',
            'rag','retrieval','augmented','generation',
            'orchestration','workflow','langchain','prompt','prompting',
        ],
        action() { _reveal('#case-asl-guide'); },
    },
    {
        type:  'project',
        id:    'case-maintenance',
        label: 'Predictive Maintenance — Bosch',
        sub:   'Autoencoder anomaly detection · 40+ TB telemetry · est. €300K+ annualized savings',
        route: ['M', 'blue'],   // route bullet shown in results
        tokens: [
            'project','work','case','study','studies','portfolio',  // section words
            'predictive','maintenance','autoencoder','anomaly','detection',
            'telemetry','sensor','databricks','pyspark','spark','40tb','40',
            'savings','300k','testing','cycles','production',
        ],
        action() { _reveal('#case-maintenance'); },
    },
    {
        type:  'project',
        id:    'case-valfred',
        label: 'Valfred — GenAI Data Assistant',
        sub:   'Multi-agent · schema retrieval · self-healing SQL · Databricks',
        route: ['G', 'purple'],   // route bullet shown in results
        tokens: [
            'project','work','case','study','studies','portfolio',  // section words
            'valfred','genai','generative','llm','agent','agents','multiagent','multi',
            'sql','text2sql','nlq','natural','language','query','querying',
            'vector','schema','retrieval','rag','self-healing','healing',
            'mlflow','unity','catalog','databricks','leepa','webdvp','81',
            'assistant',
        ],
        action() { _reveal('#case-valfred'); },
    },
    {
        type:  'project',
        id:    'retinopathy',
        label: 'Diabetic Retinopathy Classifier',
        sub:   'ResNet50 · fastai · Grad-CAM · Healthcare · 0.96 quadratic weighted kappa',
        route: ['R', 'teal'],   // route bullet shown in results
        tokens: [
            'project','research','paper','publication',  // section words
            'retinopathy','diabetic','fundus','kappa','96',
            'resnet','resnet50','fastai','pytorch','gradcam','grad','cam','interpretability','explainability',
            'clinical','healthcare','medical','health','eye','disease','diagnosis',
            'keras','opencv','cnn','convolution','convolutional',
            'vision','computer','cv','imaging','classification','lesion',
            'kaggle','dataset','benchmark',
        ],
        action() { _reveal('#research-retinopathy'); },
    },
    {
        type:  'project',
        id:    'vqvae-conformer',
        label: 'VQ-VAE + Conformer Translation System',
        sub:   'VQ-VAE · Conformer · CTC-Attention · Beam Search · PyTorch',
        route: ['A', 'yellow'],   // route bullet shown in results
        tokens: [
            'project','research','paper','publication',  // section words
            'vqvae','vq','vae','conformer','quantization','quantize',
            'ctc','attention','beam','search','prefix','scoring',
            'continuous','slt','translation','sequence','seq2seq',
            'hierarchical','factors','pose','motion','dynamics','facial',
            'signer','independent','dominance','normalization',
            'pytorch','mediapipe','research','2026','current','progress','wip',
            'sign','language','gloss','landmark','landmarks',
        ],
        action() { _reveal('#research'); },
    },
    {
        type:  'project',
        id:    'stgcn',
        label: 'Graph-Based Sign Language Recognition',
        sub:   'ST-GCN · 209 joints · Edge Importance · Spatial Attention',
        route: ['A', 'yellow'],   // route bullet shown in results
        tokens: [
            'project','research','paper','publication',  // section words
            'stgcn','st','gcn','graph','convolutional','network',
            'skeletal','skeleton','joints','adjacency','matrix',
            'edge','importance','spatial','attention','weighting',
            'residual','temporal','kernels','multi','scale',
            'fingertips','velocity','motion','postural','transition',
            'pytorch','mediapipe','research','2025',
            'sign','language','recognition',
        ],
        action() { _reveal('#research'); },
    },
    {
        type:  'project',
        id:    'temporal-asl',
        label: 'LandmarkConformer — Sign Recognition',
        sub:   'Multi-stream Conformer · Google ASL Signs (250 classes) · 76.65% · signer-independent',
        route: ['A', 'yellow'],   // route bullet shown in results
        tokens: [
            'project','research','paper','publication',  // section words
            'temporal','modeling','sequence','video',
            'google','asl-signs','aslsigns','isolated','kaggle','250',
            'cnn','transformer','attention','architecture',
            'pytorch','scaling','scale','dataset','keypoint','keypoints','543',
            '76','76.65','signs','top1','accuracy','conformer','landmarkconformer','grl','gradient','reversal',
            'mixup','dropout','augmentation','tta','amp','focal','loss',
            'asl','sign','language','recognition','research','2024',
        ],
        action() { _reveal('#research'); },
    },
    {
        type:  'project',
        id:    'iccar',
        label: 'IEEE ICCAR 2022 Publication',
        sub:   'MediaPipe · XGBoost · Dynamic Sign Language · Published',
        route: ['A', 'yellow'],   // route bullet shown in results
        tokens: [
            'project','research','paper','publication',  // section words
            'ieee','iccar','2022','publication','paper','published','doi',
            'xgboost','mediapipe','dynamic','static',
            'research','sign','language','recognition',
            '90','15','phrases','gesture',
            'computer','vision','cv',
        ],
        action() { _reveal('#research'); },
    },

    {
        type:  'story',
        id:    'bosch-sr',
        label: 'Senior ML Engineer — Bosch',
        sub:   'Autoencoder · Anomaly Detection · Azure · Power BI · Mentoring',
        route: ['M', 'blue'],   // route bullet shown in results
        tokens: [
            'experience','career','job','role','employment',  // section words
            'bosch','senior','2025','2026','valfred',
            'databricks','pyspark','spark','partition','telemetry','ingestion','ingest',
            'tb','40tb','40','high','frequency','sensor',
            'autoencoder','anomaly','anomaly detection','detection',
            'predictive','maintenance','pipeline','production',
            'cycles','testing','saving','savings',
            '300k','300','4 months','months',
            'azure','power','powerbi','bi',
            'spoc','automation','initiatives','india','germany','china',
            'mentor','mentoring','mentored','interns','internship','onboarding',
            'machine','learning','engineer','infrastructure',
            'mlops','genai','generative','ai','llm','production','ml',
            'multi-agent','multi','agent','agents','assistant','orchestrated',
            'natural','language','nlq','query','querying','sql',
            'vector','schema','retrieval','self-healing',
            'mlflow','unity','catalog','leepa','webdvp','81','65',
        ],
        action() { _reveal('#role-bosch-sr'); },
    },
    {
        type:  'story',
        id:    'bosch-ml',
        label: 'ML Engineer — Bosch',
        sub:   'TF 1.x → PyTorch · 48% shorter training · KL divergence drift · Power BI',
        route: ['M', 'blue'],   // route bullet shown in results
        tokens: [
            'experience','career','job','role','employment',  // section words
            'bosch','ml','2023','2024',
            'elastic','net','regression','autosar','dem','debounce','recall','0.92',
            'failure','predictive','early','warning','30','seconds',
            'migration','tf','tf1.x','tensorflow','pytorch',
            '48','faster','training','train','speed','throughput',
            'azure','gpu','cloud','multi','distributed',
            'drift','detection','kl','divergence','distribution','hypothesis','testing',
            'online','shift','sensor','sensors','accuracy','95',
            'dashboard','dashboards','powerbi','power bi','power','bi',
            'ecu','ecus','100','engineering','teams',
            'machine','learning','engineer',
        ],
        action() { _reveal('#role-bosch-ml'); },
    },
    {
        type:  'story',
        id:    'bosch-swe',
        label: 'Software Developer — Bosch',
        sub:   'Automation Tools · Flask · PCB Pricing · Automotive Test Data',
        route: ['S', 'green'],   // route bullet shown in results
        tokens: [
            'experience','career','job','role','employment',  // section words
            'bosch','software','developer','2021','2023',
            'automation','automated','tools','gui','guis',
            '45','manual','data','analysis','analysts','engineers','25',
            'pcb','pricing','accuracy','30','processing','time','90','5',
            'flask','apps','application','automotive',
            'test','visualization','visualize',
        ],
        action() { _reveal('#role-bosch-swe'); },
    },
    {
        type:  'story',
        id:    'goldman',
        label: 'Goldman Sachs — Junior Analyst (Intern)',
        sub:   'Trade Booking Automation · Finance · Python · 65% faster',
        route: ['S', 'green'],   // route bullet shown in results
        tokens: [
            'experience','career','job','role','employment',  // section words
            'goldman','sachs','gs',
            'junior','analyst','finance','banking','financial','bank',
            'trade','trading','booking','verification','bookings',
            '65','faster','automated','automation',
            'python','script','2021',
        ],
        action() { _reveal('#role-goldman'); },
    },
    {
        type:  'story',
        id:    'education',
        label: 'PES University — BTech EEE',
        sub:   'Electrical & Electronics · CGPA 8.5 · 2017–2021',
        route: ['R', 'teal'],   // route bullet shown in results
        tokens: [
            'education','school',  // section words
            'pes','university','btech','btech','degree',
            'electrical','electronics','eee',
            'cgpa','gpa','8.5','grade',
            '2017','2021','graduation','undergraduate','college',
            'bengaluru','bangalore',
        ],
        action() { _reveal('#education'); },
    },
    {
        type:  'story',
        id:    'education-ubc',
        label: 'University of British Columbia — MDS',
        sub:   'Master of Data Science · Vancouver, Canada · 2026–2027',
        route: ['M', 'blue'],   // route bullet shown in results
        tokens: [
            'education','school',  // section words
            'ubc','british','columbia','university','masters','mds',
            'data','science','degree','grad','graduate',
            '2026','2027','vancouver','canada','current','now',
        ],
        action() { _reveal('#role-ubc'); },   // the current stop on the experience line
    },
];

/* ── State ─────────────────────────────────────────────────────────── */
let _overlay = null;
let _input   = null;
let _results = null;
let _active  = -1;
let _modal   = null;

/* ── Public init ───────────────────────────────────────────────────── */
export function initSearch() {
    _buildOverlay();

    // ⌘K / Ctrl+K
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (_modal.isOpen()) _close();
            else if (!isModalOpen()) _open();   // never stack on top of another modal
        }
    });

    const trigger = document.getElementById('search-trigger');
    if (trigger) trigger.addEventListener('click', _open);
}

/* ── Overlay DOM ───────────────────────────────────────────────────── */
function _buildOverlay() {
    _overlay = makeOverlay('v2-search-overlay', 'Portfolio search');

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
    _input.setAttribute('role',              'combobox');
    _input.setAttribute('aria-autocomplete', 'list');
    _input.setAttribute('aria-expanded',     'true');
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
    _results.setAttribute('aria-label', 'Search results');
    modal.appendChild(_results);

    _overlay.appendChild(modal);
    document.body.appendChild(_overlay);
    _modal = createModal(_overlay, 'v2-search-overlay--open');

    _overlay.addEventListener('click', e => { if (e.target === _overlay) _close(); });
    _input.addEventListener('input',   _onInput);
    _input.addEventListener('keydown', _onKeyDown);
}

function _onInput() {
    const q = _input.value.trim();
    _setActive(-1);
    if (!q) { _showTips(); return; }
    _renderResults(_query(q), q);
}

function _onKeyDown(e) {
    const items = _results.querySelectorAll('.v2-search-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        _setActive(Math.min(_active + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _setActive(Math.max(_active - 1, 0));
    } else if (e.key === 'Enter' && _active >= 0) {
        e.preventDefault();
        items[_active].click();
    }
}

// Focus stays in the input; the highlighted option is exposed to assistive
// tech via aria-activedescendant + aria-selected (APG combobox pattern).
function _setActive(idx) {
    _active = idx;
    const items = _results.querySelectorAll('.v2-search-item');
    items.forEach((el, i) => {
        el.classList.toggle('v2-search-item--active', i === idx);
        el.setAttribute('aria-selected', String(i === idx));
    });
    if (idx >= 0 && items[idx]) {
        _input.setAttribute('aria-activedescendant', items[idx].id);
        items[idx].scrollIntoView({ block: 'nearest' });
    } else {
        _input.removeAttribute('aria-activedescendant');
    }
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
                    if (t === w || t === _singular(w)) {
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
        .slice(0, 8)
        .map(({ item }) => item);
}

// "projects" → "project", "papers" → "paper"; leaves "ss" words like "class" alone
function _singular(w) {
    return w.length >= 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
}

/* ── Rendering ─────────────────────────────────────────────────────── */
function _renderResults(hits, query) {
    clearEl(_results);

    if (!hits.length) {
        const empty = _el('div', 'v2-search-empty');
        empty.textContent = `No matches for "${query}" — try "autoencoder", "drift detection", "flask", or "ieee"`;
        _results.appendChild(empty);
        return;
    }

    let optIdx = 0;
    const groups = { project: [], story: [] };
    hits.forEach(h => groups[h.type].push(h));

    [['project', 'Projects'], ['story', 'Experience & Education']].forEach(([type, label]) => {
        if (!groups[type].length) return;

        const hdr = _el('div', 'v2-search-group-hdr');
        hdr.textContent = label;
        _results.appendChild(hdr);

        groups[type].forEach(item => {
            const el  = _el('div', 'v2-search-item');
            el.id = `search-opt-${optIdx++}`;
            el.setAttribute('role', 'option');
            el.setAttribute('aria-selected', 'false');

            const ico  = _el('span', 'v2-bullet v2-search-item-ico');
            ico.textContent = item.route[0];
            ico.dataset.r   = item.route[1];
            ico.setAttribute('aria-hidden', 'true');

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
            el.addEventListener('mousedown', e => e.preventDefault()); // keep focus in input
            _results.appendChild(el);
        });
    });
}

function _showTips() {
    clearEl(_results);

    const tip = _el('div', 'v2-search-tip');
    const lines = [
        '"autoencoder anomaly detection"',
        '"Databricks PySpark 40TB"',
        '"VQ-VAE Conformer translation"',
        '"spaced repetition"',
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
    _input.value = '';
    _showTips();
    _setActive(-1);
    _modal.open(_input);
}

function _close() {
    _modal.close();
}

/* ── Helpers ───────────────────────────────────────────────────────── */
// Section fragments may still be loading when search opens; wait for them,
// expand a collapsed timeline entry if needed, then scroll it into view.
async function _reveal(selector) {
    await sectionsReady;
    const target = document.querySelector(selector);
    if (!target) return;
    // Expand a collapsed experience entry; case-study details stay as the reader left them
    const details = target.matches('.v2-tl-item') && target.querySelector('details');
    if (details) details.open = true;
    scrollToEl(target);
}
