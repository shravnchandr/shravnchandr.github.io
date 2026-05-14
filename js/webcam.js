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
import { updateLetterDisplay, makeTop3Row, clearEl } from './utils.js';

const MP_HANDS_VERSION = '@mediapipe/hands@0.4.1675469240';
const MP_HANDS_CDN     = `https://cdn.jsdelivr.net/npm/${MP_HANDS_VERSION}/hands.js`;
const MP_HANDS_BASE    = `https://cdn.jsdelivr.net/npm/${MP_HANDS_VERSION}/`;
const MODEL_SRC        = './asl_model.js';
const APP_URL          = 'https://asl-guide.onrender.com';

const STATUS_TIMEOUT_MS = 7000;   // AbortController timeout for app-status ping
const STATUS_FAST_MS    = 2500;   // response faster than this → "live" (vs "waking up")
const CAM_WIDTH         = 640;
const CAM_HEIGHT        = 480;

const BTN_STATE_LOADING = 'loading';
const BTN_STATE_ACTIVE  = 'active';
const BTN_STATE_IDLE    = 'idle';

const CLS_BTN_ACTIVE   = 'v2-webcam-btn--active';
const CLS_VIDEO_ACTIVE = 'v2-webcam-video--active';

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
    const scaled = flat.map((v, i) => {
        const s = scale[i];
        return s !== 0 ? (v - mean[i]) / s : 0;
    });

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

let _active  = false;
let _hands   = null;
let _stream  = null;
let _video   = null;
let _rafId   = null;

let _prevLetter = null;

function _onResults(results) {
    if (!_active) return;
    if (!results.multiHandLandmarks?.length) return;

    const lms      = results.multiHandLandmarks[0];
    const worldLms = results.multiHandWorldLandmarks?.[0];

    // Mirror x: front-facing camera gives laterally-flipped coordinates
    const svgPose = lms.map(({ x, y }) => [(1 - x) * 100, y * 125]);
    drawHandPose(svgPose);

    if (worldLms && _modelData) {
        const preds = _classify(worldLms);
        if (preds) _updatePanel(preds);
    }
}

function _updatePanel([top, ...rest]) {
    const letterEl   = document.getElementById('asl-pred-letter');
    const confValEl  = document.getElementById('asl-conf-val');
    const confFillEl = document.getElementById('asl-conf-fill');
    const signingEl  = document.getElementById('asl-signing-label');
    const top3El     = document.getElementById('asl-top3');

    _prevLetter = updateLetterDisplay(letterEl, top.key, _prevLetter);
    if (confValEl)  confValEl.textContent  = `${(top.conf * 100).toFixed(1)}%`;
    if (confFillEl) confFillEl.style.width = `${top.conf * 100}%`;
    if (signingEl)  signingEl.textContent  = `SIGNING: ${top.key} · LIVE CAM`;

    if (top3El) {
        clearEl(top3El);
        [top, ...rest].forEach(({ key, conf }, i) => {
            top3El.appendChild(makeTop3Row(i + 1, key, conf, i === 0));
        });
    }
}

async function _sendFrame() {
    if (!_active) return;
    if (_video && _video.readyState >= 2) {
        await _hands.send({ image: _video });
    }
    _rafId = requestAnimationFrame(_sendFrame);
}

async function _start(btn) {
    _setBtnState(btn, BTN_STATE_LOADING);

    // Load model weights + MediaPipe lazily on first activation.
    // External CDN or local script load can genuinely fail (offline, CDN outage, 404).
    // Partial failure must not crash the page — reset button to idle so user can retry.
    try {
        const loads = [];
        if (!_modelData) loads.push(_loadScript(MODEL_SRC));
        if (!_hands)     loads.push(_loadScript(MP_HANDS_CDN));
        await Promise.all(loads);
    } catch (err) {
        console.error('[webcam] Failed to load dependencies:', err);
        _setBtnState(btn, BTN_STATE_IDLE);
        return;
    }

    // ASL_MODEL_DATA is a top-level const in a non-module script — accessible via window
    if (!_modelData) {
        /* global ASL_MODEL_DATA */
        if (typeof ASL_MODEL_DATA !== 'undefined') {
            _modelData = ASL_MODEL_DATA; // eslint-disable-line no-undef
        } else {
            console.warn('[webcam] ASL_MODEL_DATA not found after script load');
        }
    }

    if (!_hands) {
        // MediaPipe Hands initialisation downloads WASM and model assets from CDN.
        // This can fail if the CDN is unreachable, the browser blocks WASM, or WebGL
        // is unavailable. Failure must not crash the page — reset button to idle.
        try {
            _hands = new window.Hands({
                locateFile: f => `${MP_HANDS_BASE}${f}`,
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
            _setBtnState(btn, BTN_STATE_IDLE);
            return;
        }
    }

    // getUserMedia rejects when the user denies camera permission, no camera is present,
    // or the context is not secure (non-HTTPS). This is expected user input, not a bug —
    // reset button to idle so the user can see the feature is unavailable.
    try {
        _stream = await navigator.mediaDevices.getUserMedia({
            video: { width: CAM_WIDTH, height: CAM_HEIGHT, facingMode: 'user' },
        });
    } catch (err) {
        console.warn('[webcam] Camera access denied:', err);
        _setBtnState(btn, BTN_STATE_IDLE);
        return;
    }

    _video = document.getElementById('webcam-video');
    if (!_video) { _stop(btn); return; }

    _video.srcObject = _stream;
    await _video.play();
    _video.classList.add(CLS_VIDEO_ACTIVE);

    _active = true;
    pauseASL();
    _setBtnState(btn, BTN_STATE_ACTIVE);
    _rafId = requestAnimationFrame(_sendFrame);
}

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
        _video.classList.remove(CLS_VIDEO_ACTIVE);
    }

    resumeASL();
    _setBtnState(btn, BTN_STATE_IDLE);
}

function _setBtnState(btn, state) {
    const labelEl = btn.querySelector('.v2-webcam-label');
    const dotEl   = btn.querySelector('.v2-webcam-dot');

    if (state === BTN_STATE_LOADING) {
        btn.disabled = true;
        labelEl.textContent = 'Loading…';
        dotEl.style.background = 'var(--v2-text-muted)';
    } else if (state === BTN_STATE_ACTIVE) {
        btn.disabled = false;
        btn.classList.add(CLS_BTN_ACTIVE);
        labelEl.textContent = 'Stop camera';
        dotEl.style.background = 'var(--v2-inference)';
    } else {
        btn.disabled = false;
        btn.classList.remove(CLS_BTN_ACTIVE);
        labelEl.textContent = 'Try live →';
        dotEl.style.background = 'var(--v2-data)';
    }
}

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

function checkAppStatus() {
    const dot   = document.getElementById('asl-status-dot');
    const label = document.getElementById('asl-status-label');
    if (!dot || !label) return;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), STATUS_TIMEOUT_MS);
    const t0 = Date.now();

    fetch(APP_URL, { method: 'HEAD', mode: 'no-cors', signal: ctrl.signal })
        .then(() => {
            clearTimeout(timer);
            const ms = Date.now() - t0;
            if (ms < STATUS_FAST_MS) {
                dot.className   = 'v2-app-dot v2-app-dot--live';
                label.textContent = '● live';
            } else {
                dot.className   = 'v2-app-dot v2-app-dot--slow';
                label.textContent = '● waking up';
            }
        })
        .catch(() => {
            // In no-cors mode the fetch either resolves (server reachable) or rejects
            // (network error, CORS block, or AbortController timeout above). All rejection
            // reasons are indistinguishable and all mean the same thing: server is offline.
            // Do not log — this rejection fires on every page load when the app is sleeping.
            dot.className   = 'v2-app-dot v2-app-dot--offline';
            label.textContent = '○ offline';
        });
}

export function initWebcam() {
    const btn = document.getElementById('webcam-toggle');
    if (btn) {
        if (!navigator.mediaDevices?.getUserMedia) {
            btn.closest('.v2-webcam-cta')?.remove();
        } else {
            btn.addEventListener('click', () => {
                if (_active) _stop(btn);
                else         _start(btn);
            });
        }
    }

    checkAppStatus();
}
