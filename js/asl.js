/**
 * asl.js — SVG-based ASL fingerspell animation (A–Z + 0–9, random cycle).
 *
 * Ported from the design prototype (option2-v2.jsx).
 * Uses a procedural 21-landmark hand skeleton; no webcam or MediaPipe required.
 * DOM updates use textContent / setAttribute — no innerHTML anywhere.
 */

// ── Hand geometry constants ──────────────────────────────────
const WRIST = [50, 112];
const MCP = {
    thumb:  [36, 104],
    index:  [40, 96],
    middle: [48, 95],
    ring:   [56, 96],
    pinky:  [64, 98],
};

function chain(base, dir, lens) {
    const pts = [base];
    let [x, y] = base;
    for (const l of lens) { x += dir[0] * l; y += dir[1] * l; pts.push([x, y]); }
    return pts;
}

function finger(base, state) {
    switch (state) {
        case 'ext':  return chain(base, [0,-1],      [10,8,7]);
        case 'extL': return chain(base, [-0.15,-1],  [10,8,7]);
        case 'extR': return chain(base, [0.15,-1],   [10,8,7]);
        case 'side': return chain(base, [-1,0],      [10,8,7]);
        case 'bent': {
            const j1   = chain(base, [0,-1], [8]);
            const rest = chain(j1[1], [0.6, 0.3], [6,5]);
            return [base, j1[1], rest[1], rest[2]];
        }
        default: // curl
            return [base,[base[0],base[1]-5],[base[0]+2,base[1]-2],[base[0]+3,base[1]+2]];
    }
}

function thumb(state) {
    const b = MCP.thumb;
    switch (state) {
        case 'up':     return chain(b, [-0.2,-1], [7,6,5]);
        case 'side':   return chain(b, [-1,-0.1], [7,6,5]);
        case 'side2':  return chain(b, [-1, 0.1], [7,6,5]);
        case 'across': return [b,[b[0]+4,b[1]-2],[b[0]+10,b[1]-3],[b[0]+16,b[1]-3]];
        case 'tuck':   return [b,[b[0]+3,b[1]-3],[b[0]+8, b[1]-4],[b[0]+12,b[1]-2]];
        default: // curl
            return [b,[b[0]+2,b[1]-3],[b[0]+5,b[1]-2],[b[0]+7,b[1]+1]];
    }
}

function buildPose(t, idx, mid, rng, pnk) {
    const th = thumb(t);
    const i  = finger(MCP.index,  idx);
    const m  = finger(MCP.middle, mid);
    const r  = finger(MCP.ring,   rng);
    const p  = finger(MCP.pinky,  pnk);
    return [
        WRIST,
        th[1],th[2],th[3],th[3],
        i[0], i[1], i[2], i[3],
        m[0], m[1], m[2], m[3],
        r[0], r[1], r[2], r[3],
        p[0], p[1], p[2], p[3],
    ];
}

// ── Sign dictionary (A-Z + 0-9) ─────────────────────────────
const SPEC = {
    A:['up','curl','curl','curl','curl'],   B:['across','ext','ext','ext','ext'],
    C:['side','bent','bent','bent','bent'], D:['tuck','ext','curl','curl','curl'],
    E:['tuck','curl','curl','curl','curl'], F:['tuck','curl','ext','ext','ext'],
    G:['side','side','curl','curl','curl'], H:['tuck','ext','ext','curl','curl'],
    I:['curl','curl','curl','curl','ext'],  J:['curl','curl','curl','curl','ext'],
    K:['up','ext','extR','curl','curl'],    L:['side','ext','curl','curl','curl'],
    M:['tuck','curl','curl','curl','curl'], N:['tuck','curl','curl','curl','curl'],
    O:['bent','bent','bent','bent','bent'], P:['side','ext','extR','curl','curl'],
    Q:['side2','side','curl','curl','curl'],R:['tuck','extL','extR','curl','curl'],
    S:['across','curl','curl','curl','curl'],T:['tuck','curl','curl','curl','curl'],
    U:['tuck','ext','ext','curl','curl'],   V:['tuck','extL','extR','curl','curl'],
    W:['tuck','ext','ext','ext','curl'],    X:['curl','bent','curl','curl','curl'],
    Y:['side','curl','curl','curl','ext'],  Z:['curl','ext','curl','curl','curl'],
    '0':['bent','bent','bent','bent','bent'],'1':['curl','ext','curl','curl','curl'],
    '2':['curl','extL','extR','curl','curl'],'3':['up','ext','ext','curl','curl'],
    '4':['across','ext','ext','ext','ext'], '5':['side','ext','ext','ext','ext'],
    '6':['tuck','ext','ext','ext','curl'],  '7':['tuck','ext','ext','curl','ext'],
    '8':['tuck','ext','curl','ext','ext'],  '9':['tuck','curl','ext','ext','ext'],
};

const SIGNS = Object.fromEntries(
    Object.entries(SPEC).map(([k, s]) => [k, buildPose(...s)])
);
const KEYS = Object.keys(SIGNS);

const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[0,17],[17,18],[18,19],[19,20],
];

const ALTS = {
    A:['S','T'],B:['4','5'],C:['O','G'],D:['1','Z'],E:['S','O'],F:['9','R'],
    G:['Q','L'],H:['U','V'],I:['J','Y'],J:['I','Y'],K:['V','P'],L:['G','1'],
    M:['N','T'],N:['M','T'],O:['C','0'],P:['K','H'],Q:['G','P'],R:['U','V'],
    S:['A','T'],T:['N','M'],U:['V','H'],V:['U','2'],W:['6','3'],X:['D','1'],
    Y:['I','J'],Z:['D','1'],'0':['O','C'],'1':['D','Z'],'2':['V','H'],
    '3':['W','6'],'4':['B','5'],'5':['4','B'],'6':['W','F'],'7':['8','9'],
    '8':['7','9'],'9':['F','8'],
};

// ── Animation helpers ────────────────────────────────────────
const lerp   = (a, b, t) => a.map((p, i) => [p[0]+(b[i][0]-p[0])*t, p[1]+(b[i][1]-p[1])*t]);
const easeIO = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;

function pickNext(cur) {
    let k = KEYS[Math.floor(Math.random() * KEYS.length)];
    let guard = 0;
    while (k === cur && ++guard < 8) k = KEYS[Math.floor(Math.random() * KEYS.length)];
    return k;
}

// ── SVG element factory ──────────────────────────────────────
const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
}

/** Build a safe Top-3 row using DOM APIs (no innerHTML) */
function makeTop3Row(rank, letter, pct, isTop) {
    const row = document.createElement('div');
    row.className = isTop ? 'v2-t3-row top' : 'v2-t3-row';

    const idx = document.createElement('span');
    idx.className   = 'v2-t3-idx';
    idx.textContent = `${rank}.`;

    const ltr = document.createElement('span');
    ltr.className   = 'v2-t3-letter';
    ltr.textContent = letter;

    const pctEl = document.createElement('span');
    pctEl.className   = 'v2-t3-pct';
    pctEl.textContent = `${(pct * 100).toFixed(1)}%`;

    row.append(idx, ltr, pctEl);
    return row;
}

// ── Webcam override — set by initASL(), called by webcam.js ─
let _pauseFn  = null;
let _resumeFn = null;
let _drawFn   = null;

/** Pause the random-cycle RAF (call before activating webcam). */
export function pauseASL() { if (_pauseFn) _pauseFn(); }

/** Resume the random-cycle RAF (call after stopping webcam). */
export function resumeASL() { if (_resumeFn) _resumeFn(); }

/**
 * Draw an arbitrary 21-point pose on the hero SVG.
 * Used by webcam.js to render live MediaPipe landmarks.
 * @param {Array<[number,number]>} pose  21 [x,y] pairs in SVG coords
 */
export function drawHandPose(pose) { if (_drawFn) _drawFn(pose); }

// ── Sequence override (logo Easter egg) ─────────────────────
// Set by spellSequence(); consumed by tick() on next frame.
let _seqQueue  = null;   // array of keys to display in order
let _seqIdx    = 0;      // index of next key to load as nxtKey
let _seqActive = false;  // true while the sequence is playing
let _onSeqDone = null;   // optional callback on completion

/**
 * Hijacks the ASL animation to spell out a sequence of keys
 * at 2× speed, then returns to the normal random cycle.
 * Silently ignored if a sequence is already running.
 */
export function spellSequence(letters, onDone) {
    if (_seqActive || _seqQueue) return;
    _seqQueue  = letters.slice();
    _seqIdx    = 0;
    _onSeqDone = onDone || null;
}

// ── Named exports for use by other modules (e.g. demo.js) ───
export { SPEC, SIGNS, CONNECTIONS };

// ── Main export ──────────────────────────────────────────────
export function initASL() {
    const svg        = document.getElementById('asl-svg');
    const letterEl   = document.getElementById('asl-pred-letter');
    const confValEl  = document.getElementById('asl-conf-val');
    const confFillEl = document.getElementById('asl-conf-fill');
    const signingEl  = document.getElementById('asl-signing-label');
    const top3El     = document.getElementById('asl-top3');

    if (!svg) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ── Static SVG grid ──────────────────────────────────────
    for (let i = 0; i <= 10; i++)
        svg.appendChild(svgEl('line',{x1:i*10,y1:0,x2:i*10,y2:125,stroke:'#2a3342','stroke-width':0.15}));
    for (let i = 0; i <= 13; i++)
        svg.appendChild(svgEl('line',{x1:0,y1:i*10,x2:100,y2:i*10,stroke:'#2a3342','stroke-width':0.15}));

    // ── Dynamic SVG elements (pre-created, updated each frame) ──
    const connLines = CONNECTIONS.map(() =>
        svg.appendChild(svgEl('line',{stroke:'#00bfa5','stroke-width':1.1,'stroke-linecap':'round',opacity:0.85}))
    );
    const jointDots = Array.from({length:21},(_,i) =>
        svg.appendChild(svgEl('circle',{r:i===0?2.2:(i%4===0?1.8:1.3),fill:'#ff6d00',stroke:'#0b0f14','stroke-width':0.3}))
    );
    const bbox = svg.appendChild(svgEl('rect',{fill:'none',stroke:'#7c4dff','stroke-width':0.4,'stroke-dasharray':'2 2'}));

    // ── State machine ────────────────────────────────────────
    const HOLD_MS      = 1100;
    const MORPH_MS     = 420;
    const SEQ_HOLD_MS  = 550;   // 2× speed for Easter egg sequence
    const SEQ_MORPH_MS = 280;

    let curKey     = KEYS[Math.floor(Math.random() * KEYS.length)];
    let nxtKey     = pickNext(curKey);
    let phase      = 'hold';
    let phaseStart = performance.now();
    let raf;

    function tick(now) {
        // Activate a pending sequence on the next available frame
        if (_seqQueue && !_seqActive) {
            _seqActive = true;
            curKey     = _seqQueue[0];
            nxtKey     = _seqQueue.length > 1 ? _seqQueue[1] : pickNext(_seqQueue[0]);
            _seqIdx    = 2;
            phase      = 'hold';
            phaseStart = now;
        }

        const holdMs  = _seqActive ? SEQ_HOLD_MS  : HOLD_MS;
        const morphMs = _seqActive ? SEQ_MORPH_MS : MORPH_MS;
        const elapsed = now - phaseStart;
        let pose, conf, displayKey;

        if (phase === 'hold') {
            pose       = SIGNS[curKey];
            conf       = 0.92 + Math.sin(now / 400) * 0.05;
            displayKey = curKey;
            if (elapsed > holdMs) { phase = 'morph'; phaseStart = now; }
        } else {
            const t    = Math.min(elapsed / morphMs, 1);
            pose       = lerp(SIGNS[curKey], SIGNS[nxtKey], easeIO(t));
            conf       = 0.55 + t * 0.4;
            displayKey = curKey;
            if (t >= 1) {
                curKey = nxtKey;
                if (_seqActive) {
                    if (_seqIdx < _seqQueue.length) {
                        nxtKey = _seqQueue[_seqIdx++];
                    } else {
                        // Sequence complete — resume random cycle
                        _seqActive = false;
                        _seqQueue  = null;
                        nxtKey     = pickNext(curKey);
                        if (_onSeqDone) { _onSeqDone(); _onSeqDone = null; }
                    }
                } else {
                    nxtKey = pickNext(curKey);
                }
                phase = 'hold';
                phaseStart = now;
            }
        }

        drawSVG(pose);
        updatePanel(displayKey, conf);
        raf = requestAnimationFrame(tick);
    }

    // Expose pause/resume/draw to webcam.js via module-level refs
    _pauseFn  = () => cancelAnimationFrame(raf);
    _resumeFn = () => { phaseStart = performance.now(); raf = requestAnimationFrame(tick); };
    _drawFn   = drawSVG;

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(raf);
        } else {
            phaseStart = performance.now();
            raf = requestAnimationFrame(tick);
        }
    });

    raf = requestAnimationFrame(tick);

    // ── Render functions ─────────────────────────────────────
    let _prevLetter = null;

    function drawSVG(pose) {
        CONNECTIONS.forEach(([a, b], i) => {
            connLines[i].setAttribute('x1', pose[a][0]);
            connLines[i].setAttribute('y1', pose[a][1]);
            connLines[i].setAttribute('x2', pose[b][0]);
            connLines[i].setAttribute('y2', pose[b][1]);
        });

        pose.forEach(([cx, cy], i) => {
            jointDots[i].setAttribute('cx', cx);
            jointDots[i].setAttribute('cy', cy);
        });

        const xs = pose.map(p => p[0]);
        const ys = pose.map(p => p[1]);
        const x0 = Math.min(...xs) - 4;
        const y0 = Math.min(...ys) - 4;
        bbox.setAttribute('x',      x0);
        bbox.setAttribute('y',      y0);
        bbox.setAttribute('width',  Math.max(...xs) - x0 + 8);
        bbox.setAttribute('height', Math.max(...ys) - y0 + 8);
    }

    function updatePanel(key, conf) {
        if (letterEl && key !== _prevLetter) {
            _prevLetter = key;
            letterEl.textContent = key;
            // Re-trigger M3 Expressive spring pop on each letter change
            letterEl.style.animation = 'none';
            void letterEl.offsetWidth; // force reflow
            letterEl.style.animation = 'm3LetterPop 520ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        } else if (letterEl) {
            letterEl.textContent = key;
        }
        if (confValEl)  confValEl.textContent  = `${(conf*100).toFixed(1)}%`;
        if (confFillEl) confFillEl.style.width = `${conf*100}%`;
        if (signingEl)  signingEl.textContent  = `SIGNING: ${key} · ASL FINGERSPELL`;

        if (top3El) {
            const alts = ALTS[key] || ['E','S'];
            const rows = [
                {l:key,     p:conf},
                {l:alts[0], p:0.04 + Math.random()*0.02},
                {l:alts[1], p:0.02 + Math.random()*0.015},
            ];
            // Safe DOM rebuild — no innerHTML
            while (top3El.firstChild) top3El.removeChild(top3El.firstChild);
            rows.forEach((r, i) => top3El.appendChild(makeTop3Row(i+1, r.l, r.p, i===0)));
        }
    }
}
