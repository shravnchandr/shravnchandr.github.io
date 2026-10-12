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
 */

import { pauseASL, resumeASL, drawHandPose, hideHandPose } from './asl.js';
import { updateLetterDisplay, renderTop3, clearEl } from './utils.js';

const MP_HANDS_VERSION = '@mediapipe/hands@0.4.1675469240';
const MP_HANDS_CDN     = `https://cdn.jsdelivr.net/npm/${MP_HANDS_VERSION}/hands.js`;
const MP_HANDS_BASE    = `https://cdn.jsdelivr.net/npm/${MP_HANDS_VERSION}/`;
const MODEL_SRC        = './asl_model.js';

const CAM_WIDTH         = 640;
const CAM_HEIGHT        = 480;
const SVG_W             = 100;    // #asl-svg viewBox width
const SVG_H             = 125;    // #asl-svg viewBox height
const STABLE_FRAMES     = 8;      // consecutive frames before a letter is announced
const ANNOUNCE_MIN_CONF = 0.6;
// Easter egg: fingerspell H then I to the live camera → a "next stop" message.
// Only reachable after the visitor starts the camera; nothing extra downloads.
const SECRET            = ['H', 'I'];
const SECRET_WINDOW_MS  = 6000;   // both letters within this time

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
let _session = 0;        // bumped on every start/stop; stale async work checks it
let _btn     = null;
let _hands   = null;
let _stream  = null;
let _video   = null;
let _rafId   = null;

let _prevLetter  = null;
let _handVisible = false;
let _stableKey   = null;
let _stableCount = 0;
let _announced   = null;

/**
 * Map a normalised MediaPipe landmark (relative to the raw video frame) into
 * #asl-svg user space. The video is drawn with object-fit: cover and mirrored,
 * and the SVG uses the default xMidYMid meet, so both transforms are applied
 * against the element's current box.
 */
function _makeProjector() {
    const vw = _video.videoWidth  || CAM_WIDTH;
    const vh = _video.videoHeight || CAM_HEIGHT;
    const cw = _video.clientWidth;
    const ch = _video.clientHeight;
    if (!cw || !ch) return ({ x, y }) => [(1 - x) * SVG_W, y * SVG_H];

    const cover = Math.max(cw / vw, ch / vh);
    const dw = vw * cover, dh = vh * cover;
    const ox = (cw - dw) / 2, oy = (ch - dh) / 2;

    const meet = Math.min(cw / SVG_W, ch / SVG_H);
    const sx = (cw - SVG_W * meet) / 2, sy = (ch - SVG_H * meet) / 2;

    return ({ x, y }) => {
        const px = cw - (ox + x * dw);   // mirrored, matching scaleX(-1) on the video
        const py = oy + y * dh;
        return [(px - sx) / meet, (py - sy) / meet];
    };
}

function _onResults(results) {
    if (!_active) return;
    if (!results.multiHandLandmarks?.length) {
        if (_handVisible) _showNoHand();
        return;
    }
    _handVisible = true;

    const lms      = results.multiHandLandmarks[0];
    const worldLms = results.multiHandWorldLandmarks?.[0];

    const project = _makeProjector();
    drawHandPose(lms.map(project));

    if (worldLms && _modelData) {
        const preds = _classify(worldLms);
        if (preds) _updatePanel(preds);
    }
}

function _panelEls() {
    return {
        letterEl:   document.getElementById('asl-pred-letter'),
        confValEl:  document.getElementById('asl-conf-val'),
        confFillEl: document.getElementById('asl-conf-fill'),
        signingEl:  document.getElementById('asl-signing-label'),
        top3El:     document.getElementById('asl-top3'),
    };
}

function _showNoHand() {
    _handVisible = false;
    _stableKey = null; _stableCount = 0;
    hideHandPose();
    const { letterEl, confValEl, confFillEl, signingEl, top3El } = _panelEls();
    _prevLetter = updateLetterDisplay(letterEl, '—', _prevLetter);
    if (confValEl)  confValEl.textContent  = '—';
    if (confFillEl) confFillEl.style.width = '0%';
    if (signingEl)  signingEl.textContent  = 'NO HAND DETECTED · LIVE CAM';
    if (top3El)     clearEl(top3El);
}

function _announce(key, conf) {
    // Announce only letters that hold steady, so screen readers aren't flooded
    // by per-frame confidence changes.
    if (key === _stableKey) _stableCount++;
    else { _stableKey = key; _stableCount = 1; }
    if (_stableCount < STABLE_FRAMES || conf < ANNOUNCE_MIN_CONF || key === _announced) return;
    _announced = key;
    const live = document.getElementById('asl-announce');
    if (live) live.textContent = `Detected ${key}`;
    _checkSecret(key);
}

// Letters that held steady (the same ones announced), newest last
let _committed = [];
let _secretShown = false;

function _checkSecret(key) {
    const now = performance.now();
    _committed = [..._committed, { key, at: now }].filter(c => now - c.at < SECRET_WINDOW_MS).slice(-SECRET.length);
    if (_secretShown || _committed.map(c => c.key).join('') !== SECRET.join('')) return;
    _secretShown = true;
    _showSecret();
}

function _showSecret() {
    const wrap = document.querySelector('.v2-asl-canvas-wrap');
    if (!wrap || wrap.querySelector('.v2-secret')) return;
    // Overlays the canvas (absolute) — the layout never moves
    const card = document.createElement('div');
    card.className = 'v2-secret v2-sign';
    card.setAttribute('role', 'status');
    const title = document.createElement('p');
    title.className = 'v2-secret-title';
    title.textContent = 'Next stop: a conversation.';
    const mail = document.createElement('a');
    mail.href = 'mailto:schandra.nyc@gmail.com';
    mail.textContent = 'schandra.nyc@gmail.com';
    const note = document.createElement('p');
    note.className = 'v2-secret-note';
    note.textContent = 'You just signed H-I to a model running in your browser.';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'v2-secret-close';
    close.setAttribute('aria-label', 'Close message');
    close.textContent = '×';
    close.addEventListener('click', () => { card.remove(); wrap.classList.remove('has-secret'); });
    card.append(close, title, mail, note);
    wrap.appendChild(card);
    wrap.classList.add('has-secret');   // hides the status line underneath (css/webcam.css)
}

function _updatePanel([top, ...rest]) {
    const { letterEl, confValEl, confFillEl, signingEl, top3El } = _panelEls();

    _prevLetter = updateLetterDisplay(letterEl, top.key, _prevLetter);
    if (confValEl)  confValEl.textContent  = `${(top.conf * 100).toFixed(1)}%`;
    if (confFillEl) confFillEl.style.width = `${top.conf * 100}%`;
    if (signingEl)  signingEl.textContent  = `SIGNING: ${top.key} · LIVE CAM`;
    renderTop3(top3El, [top, ...rest]);
    _announce(top.key, top.conf);
}

function _setMeta(engine, latency) {
    const engineEl  = document.getElementById('asl-meta-engine');
    const latencyEl = document.getElementById('asl-meta-latency');
    if (engineEl)  engineEl.textContent  = engine;
    if (latencyEl) latencyEl.textContent = `latency: ${latency}`;
}

// The caption under the demo describes what's on screen: the procedural cycle,
// or — while the camera runs — the live feed (and that nothing leaves the browser)
const CAPTION_LIVE = 'Live: your camera, classified in your browser. Nothing is uploaded.';
let _captionDemo = null;
function _setCaption(live) {
    const cap = document.querySelector('.v2-asl-caption');
    if (!cap) return;
    if (_captionDemo === null) _captionDemo = cap.textContent;
    cap.textContent = live ? CAPTION_LIVE : _captionDemo;
}

function _setHint(text) {
    const hint = document.getElementById('webcam-hint');
    if (hint) hint.textContent = text;
}

let _lastLatencyAt = 0;
let _warmedUp      = false;   // first send() includes WASM/model warm-up — don't report it

async function _sendFrame(session) {
    if (session !== _session) return;
    if (_video.readyState >= 2) {
        const t0 = performance.now();
        try {
            await _hands.send({ image: _video });
        } catch (err) {
            if (session !== _session) return;
            console.error('[webcam] Hand tracking failed:', err);
            _stop('Hand tracking stopped — try again');
            return;
        }
        if (session !== _session) return;   // stopped while the send was in flight
        const now = performance.now();
        if (!_warmedUp) _warmedUp = true;
        else if (now - _lastLatencyAt > 500) {
            _lastLatencyAt = now;
            _setMeta('MediaPipe + MLP · in-browser', `${Math.round(now - t0)}ms`);
        }
    }
    _rafId = requestAnimationFrame(() => _sendFrame(session));
}

function _cameraErrorMessage(err) {
    switch (err?.name) {
        case 'NotAllowedError':  return 'Camera permission denied';
        case 'NotFoundError':    return 'No camera found';
        case 'NotReadableError': return 'Camera is in use by another app';
        default:                 return 'Couldn’t start the camera — try again';
    }
}

async function _ensureHands() {
    if (_hands) return;
    // Only cache the instance once initialize() succeeds, so a failed
    // WASM/model download is retried on the next click.
    const hands = new window.Hands({ locateFile: f => `${MP_HANDS_BASE}${f}` });
    try {
        hands.setOptions({
            maxNumHands:            1,
            modelComplexity:        1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence:  0.6,
        });
        hands.onResults(_onResults);
        await hands.initialize();
    } catch (err) {
        try { await hands.close?.(); } catch (_) { /* already broken */ }
        throw err;
    }
    _hands = hands;
}

async function _start() {
    const session = ++_session;
    _setBtnState(_btn, BTN_STATE_LOADING);
    _setHint('Loading model…');
    let stream = null;

    // Every step can fail (CDN outage, WASM blocked, permission denied, autoplay
    // policy). Any failure releases what was acquired and returns the button to idle.
    try {
        let message = 'Couldn’t load the classifier — try again';
        try {
            await Promise.all([_loadScript(MODEL_SRC), _loadScript(MP_HANDS_CDN)]);
            if (!_modelData) {
                /* global ASL_MODEL_DATA */
                if (typeof ASL_MODEL_DATA === 'undefined') throw new Error('ASL_MODEL_DATA missing');
                _modelData = ASL_MODEL_DATA; // eslint-disable-line no-undef
            }
            await _ensureHands();
        } catch (err) {
            err.userMessage = message;
            throw err;
        }
        if (session !== _session) return;

        _setHint('Waiting for camera…');
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: CAM_WIDTH, height: CAM_HEIGHT, facingMode: 'user' },
            });
        } catch (err) {
            err.userMessage = _cameraErrorMessage(err);
            throw err;
        }
        if (session !== _session) { stream.getTracks().forEach(t => t.stop()); return; }

        _video = document.getElementById('webcam-video');
        if (!_video) throw new Error('#webcam-video missing');
        _stream = stream;
        _video.srcObject = stream;
        await _video.play();
        if (session !== _session) return;

        stream.getVideoTracks().forEach(t => t.addEventListener('ended', () => {
            if (session === _session) _stop('Camera disconnected');
        }));

        _video.classList.add(CLS_VIDEO_ACTIVE);
        _active = true;
        _handVisible = true;
        _announced = null;
        pauseASL();
        _showNoHand();
        _setMeta('MediaPipe + MLP · in-browser', '—');
        _setHint('psst — try signing H-I');
        _setCaption(true);
        _setBtnState(_btn, BTN_STATE_ACTIVE);
        _rafId = requestAnimationFrame(() => _sendFrame(session));
    } catch (err) {
        if (session !== _session) return;
        console.error('[webcam] Failed to start:', err);
        if (stream && stream !== _stream) stream.getTracks().forEach(t => t.stop());
        _stop(err.userMessage || 'Couldn’t start the camera — try again');
    }
}

function _stop(message) {
    const wasActive = _active;
    _session++;
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

    if (wasActive) {
        hideHandPose();
        resumeASL();
    }
    _committed = [];
    _setCaption(false);
    document.querySelector('.v2-secret')?.remove();
    document.querySelector('.v2-asl-canvas-wrap')?.classList.remove('has-secret');
    _setMeta('procedural demo cycle', '—');
    _setHint(message || 'in-browser MLP · A–Z + DEL/SPC');
    _setBtnState(_btn, BTN_STATE_IDLE);
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

// One promise per src. Failed loads drop their <script> and cache entry so a
// retry issues a fresh request; in-flight loads are shared, not assumed ready.
const _scriptLoads = new Map();

function _loadScript(src) {
    if (_scriptLoads.has(src)) return _scriptLoads.get(src);
    const p = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.onload  = resolve;
        s.onerror = () => {
            s.remove();
            _scriptLoads.delete(src);
            reject(new Error(`Could not load ${src}`));
        };
        document.head.appendChild(s);
    });
    _scriptLoads.set(src, p);
    return p;
}

export function initWebcam() {
    _btn = document.getElementById('webcam-toggle');
    if (_btn) {
        if (!navigator.mediaDevices?.getUserMedia) {
            _btn.closest('.v2-webcam-cta')?.remove();
        } else {
            _btn.addEventListener('click', () => {
                if (_active) _stop();
                else         _start();
            });
        }
    }
}
