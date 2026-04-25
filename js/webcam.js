/**
 * js/webcam.js — Live webcam ASL classifier.
 *
 * Dynamically loads MediaPipe Hands from CDN and asl_model.js (embedded MLP
 * weights) when the user activates webcam mode.
 *
 * Classification uses the trained 3-layer MLP (63→128→64→28) with
 * StandardScaler normalisation, running entirely in-browser.
 * Input: multiHandWorldLandmarks (21 × {x,y,z} in metres).
 *
 * Draws live landmarks on the existing #asl-svg via drawHandPose(), and
 * updates the same prediction panel that the procedural animation uses.
 *
 * Public API:
 *   initWebcam()      — wires #webcam-toggle button
 *   checkAppStatus()  — pings asl-guide.onrender.com, updates status badge
 */

import { pauseASL, resumeASL, drawHandPose } from './asl.js';

const MP_HANDS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
const MODEL_SRC    = './asl_model.js';
const APP_URL      = 'https://asl-guide.onrender.com';

/* ── MLP inference ──────────────────────────────────────────── */

let _modelData = null;   // populated from window.ASL_MODEL_DATA after script load

/**
 * Matrix multiply for transposed weight matrices.
 * Weights are stored as [in_features][out_features] (exported with .T).
 * Computes: output[j] = Σ_i( input[i] * W[i][j] ) + bias[j]
 */
function _matMul(input, W, bias) {
    const inF = W.length, outF = W[0].length;
    const out = new Array(outF);
    for (let j = 0; j < outF; j++) {
        let s = bias[j];
        for (let i = 0; i < inF; i++) s += input[i] * W[i][j];
        out[j] = s;
    }
    return out;
}

function _relu(x)   { return x.map(v => (v > 0 ? v : 0)); }

function _softmax(logits) {
    const max  = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - max));
    const sum  = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

/** Map class index (0-27) to a display label. */
function _label(i) {
    if (i < 26)  return String.fromCharCode(65 + i); // A-Z
    if (i === 26) return 'DEL';
    return 'SPC';
}

/**
 * Run the MLP on multiHandWorldLandmarks (21 × {x,y,z}).
 * Returns top-3 [{key, conf}] sorted by confidence.
 */
function _classify(worldLandmarks) {
    if (!_modelData) return null;

    // 1. Flatten to 63 floats [x0,y0,z0, x1,y1,z1, …]
    const flat = [];
    for (const lm of worldLandmarks) flat.push(lm.x, lm.y, lm.z);

    // 2. StandardScaler: (val − mean) / scale
    const { mean, scale } = _modelData.scaler;
    const scaled = flat.map((v, i) => (v - mean[i]) / scale[i]);

    // 3. Forward pass: 63 → 128(ReLU) → 64(ReLU) → 28
    const { fc1_w, fc1_b, fc2_w, fc2_b, fc3_w, fc3_b } = _modelData.model;
    let x = _relu(_matMul(scaled, fc1_w, fc1_b));
    x = _relu(_matMul(x, fc2_w, fc2_b));
    const logits = _matMul(x, fc3_w, fc3_b);

    // 4. Softmax → top-3
    const probs = _softmax(logits);
    return probs
        .map((conf, idx) => ({ key: _label(idx), conf }))
        .sort((a, b) => b.conf - a.conf)
        .slice(0, 3);
}

/* ── Webcam state ───────────────────────────────────────────── */
let _active  = false;
let _hands   = null;   // MediaPipe Hands instance
let _stream  = null;   // MediaStream from getUserMedia
let _video   = null;   // <video> element
let _rafId   = null;

/* ── MediaPipe results callback ─────────────────────────────── */
let _prevLetter = null;

function _onResults(results) {
    if (!_active) return;
    if (!results.multiHandLandmarks?.length) return; // no hand in frame

    const lms      = results.multiHandLandmarks[0];
    const worldLms = results.multiHandWorldLandmarks?.[0];

    // Map MediaPipe [0,1] → SVG coords [0-100, 0-125]; mirror x for natural
    // self-view (front-facing camera gives laterally-flipped coordinates).
    const svgPose = lms.map(({ x, y }) => [(1 - x) * 100, y * 125]);
    drawHandPose(svgPose);

    // Classify using world landmarks (metres) — the model was trained on these.
    if (worldLms && _modelData) {
        const preds = _classify(worldLms);
        if (preds) _updatePanel(preds);
    }
}

/* ── Panel updater (mirrors asl.js updatePanel) ─────────────── */
function _updatePanel([top, ...rest]) {
    const letterEl   = document.getElementById('asl-pred-letter');
    const confValEl  = document.getElementById('asl-conf-val');
    const confFillEl = document.getElementById('asl-conf-fill');
    const signingEl  = document.getElementById('asl-signing-label');
    const top3El     = document.getElementById('asl-top3');

    if (letterEl) {
        if (top.key !== _prevLetter) {
            _prevLetter = top.key;
            letterEl.textContent = top.key;
            letterEl.style.animation = 'none';
            void letterEl.offsetWidth;
            letterEl.style.animation = 'm3LetterPop 520ms cubic-bezier(0.34,1.56,0.64,1)';
        } else {
            letterEl.textContent = top.key;
        }
    }
    if (confValEl)  confValEl.textContent  = `${(top.conf * 100).toFixed(1)}%`;
    if (confFillEl) confFillEl.style.width = `${top.conf * 100}%`;
    if (signingEl)  signingEl.textContent  = `SIGNING: ${top.key} · LIVE CAM`;

    if (top3El) {
        while (top3El.firstChild) top3El.removeChild(top3El.firstChild);
        [top, ...rest].forEach(({ key, conf }, i) => {
            const row = document.createElement('div');
            row.className = i === 0 ? 'v2-t3-row top' : 'v2-t3-row';
            const idx = document.createElement('span');
            idx.className = 'v2-t3-idx'; idx.textContent = `${i + 1}.`;
            const ltr = document.createElement('span');
            ltr.className = 'v2-t3-letter'; ltr.textContent = key;
            const pct = document.createElement('span');
            pct.className = 'v2-t3-pct'; pct.textContent = `${(conf * 100).toFixed(1)}%`;
            row.append(idx, ltr, pct);
            top3El.appendChild(row);
        });
    }
}

/* ── Frame loop ─────────────────────────────────────────────── */
async function _sendFrame() {
    if (!_active) return;
    if (_video && _video.readyState >= 2) {
        await _hands.send({ image: _video });
    }
    _rafId = requestAnimationFrame(_sendFrame);
}

/* ── Start ──────────────────────────────────────────────────── */
async function _start(btn) {
    _setBtnState(btn, 'loading');

    // Lazily load model weights + MediaPipe in parallel on first activation
    try {
        const loads = [];
        if (!_modelData) loads.push(_loadScript(MODEL_SRC));
        if (!_hands)     loads.push(_loadScript(MP_HANDS_CDN));
        await Promise.all(loads);
    } catch (err) {
        console.error('[webcam] Failed to load dependencies:', err);
        _setBtnState(btn, 'idle');
        return;
    }

    // Initialise model weights (ASL_MODEL_DATA is a top-level const in a
    // non-module script — accessible from ES modules via the global scope).
    if (!_modelData) {
        /* global ASL_MODEL_DATA */
        if (typeof ASL_MODEL_DATA !== 'undefined') {
            _modelData = ASL_MODEL_DATA; // eslint-disable-line no-undef
        } else {
            console.warn('[webcam] ASL_MODEL_DATA not found after script load');
        }
    }

    // Initialise MediaPipe Hands
    if (!_hands) {
        try {
            _hands = new window.Hands({
                locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
            });
            _hands.setOptions({
                maxNumHands:          1,
                modelComplexity:      1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence:  0.6,
            });
            _hands.onResults(_onResults);
            await _hands.initialize();
        } catch (err) {
            console.error('[webcam] MediaPipe init failed:', err);
            _setBtnState(btn, 'idle');
            return;
        }
    }

    // Request camera
    try {
        _stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
        });
    } catch (err) {
        console.warn('[webcam] Camera access denied:', err);
        _setBtnState(btn, 'idle');
        return;
    }

    _video = document.getElementById('webcam-video');
    if (!_video) { _stop(btn); return; }

    _video.srcObject = _stream;
    await _video.play();
    _video.classList.add('v2-webcam-video--active');

    _active = true;
    pauseASL();
    _setBtnState(btn, 'active');
    _rafId = requestAnimationFrame(_sendFrame);
}

/* ── Stop ───────────────────────────────────────────────────── */
function _stop(btn) {
    _active = false;
    cancelAnimationFrame(_rafId);
    _rafId = null;
    _prevLetter = null;

    if (_stream) {
        _stream.getTracks().forEach(t => t.stop());
        _stream = null;
    }
    if (_video) {
        _video.srcObject = null;
        _video.classList.remove('v2-webcam-video--active');
    }

    resumeASL();
    _setBtnState(btn, 'idle');
}

/* ── Button state helper ────────────────────────────────────── */
function _setBtnState(btn, state) {
    const labelEl = btn.querySelector('.v2-webcam-label');
    const dotEl   = btn.querySelector('.v2-webcam-dot');

    if (state === 'loading') {
        btn.disabled = true;
        if (labelEl) labelEl.textContent = 'Loading…';
        if (dotEl)   dotEl.style.background = 'var(--v2-text-muted)';
    } else if (state === 'active') {
        btn.disabled = false;
        btn.classList.add('v2-webcam-btn--active');
        if (labelEl) labelEl.textContent = 'Stop camera';
        if (dotEl)   dotEl.style.background = 'var(--v2-inference)';
    } else {
        btn.disabled = false;
        btn.classList.remove('v2-webcam-btn--active');
        if (labelEl) labelEl.textContent = 'Try live →';
        if (dotEl)   dotEl.style.background = 'var(--v2-data)';
    }
}

/* ── Script loader ──────────────────────────────────────────── */
function _loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.onload  = resolve;
        s.onerror = () => reject(new Error(`Could not load ${src}`));
        document.head.appendChild(s);
    });
}

/* ── Live app status ping ───────────────────────────────────── */
export function checkAppStatus() {
    const dot   = document.getElementById('asl-status-dot');
    const label = document.getElementById('asl-status-label');
    if (!dot || !label) return;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const t0 = Date.now();

    fetch(APP_URL, { method: 'HEAD', mode: 'no-cors', signal: ctrl.signal })
        .then(() => {
            clearTimeout(timer);
            const ms = Date.now() - t0;
            if (ms < 2500) {
                dot.className   = 'v2-app-dot v2-app-dot--live';
                label.textContent = '● live';
            } else {
                dot.className   = 'v2-app-dot v2-app-dot--slow';
                label.textContent = '● waking up';
            }
        })
        .catch(() => {
            dot.className   = 'v2-app-dot v2-app-dot--offline';
            label.textContent = '○ offline';
        });
}

/* ── Public init ────────────────────────────────────────────── */
export function initWebcam() {
    // Wire toggle button
    const btn = document.getElementById('webcam-toggle');
    if (btn) {
        // Hide button if getUserMedia not available (e.g. HTTP, old browser)
        if (!navigator.mediaDevices?.getUserMedia) {
            btn.closest('.v2-webcam-cta')?.remove();
        } else {
            btn.addEventListener('click', () => {
                if (_active) _stop(btn);
                else         _start(btn);
            });
        }
    }

    // Kick off app status check
    checkAppStatus();
}
