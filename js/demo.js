/**
 * demo.js — Scripted ASL Guide pipeline demo.
 *
 * Plays a scripted H-E-L-L-O W-O-R-L-D sequence: hand landmarks → TF.js
 * classifier → sign buffer (as in ASL Guide) → a prototype grammar pass →
 * spoken output. The app's own grammar agent runs English → ASL gloss.
 *
 * Fires when the demo section scrolls into view. While it plays the button
 * pauses and resumes it (WCAG 2.2.2); once finished it replays.
 * Safe DOM updates only — no innerHTML anywhere.
 */

import { SIGNS, CONNECTIONS } from './asl.js';
import { clearEl, routeFor } from './utils.js';

const NS = 'http://www.w3.org/2000/svg';

const SCRIPT      = ['H','E','L','L','O',' ','W','O','R','L','D'];
const CORRECTED   = 'Hello, world!';
const STEP_MS     = 680;
const LETTER_POP_MS = 280;  // matches SEQ_MORPH_MS in asl.js — letter pop animation duration

export function initDemo() {
    const svg       = document.getElementById('demo-asl-svg');
    const bufferEl  = document.getElementById('demo-buffer');
    const cursorEl  = document.getElementById('demo-cursor');
    const grammarEl = document.getElementById('demo-grammar');
    const outputEl  = document.getElementById('demo-output');
    const logEl     = document.getElementById('demo-log');
    const letterEl  = document.getElementById('demo-sign-letter');
    const latencyEl = document.getElementById('demo-latency');
    const replayBtn = document.getElementById('demo-replay-btn');

    if (!svg || !bufferEl) return;

    // Reduced motion: same pipeline, rendered straight to its finished state.
    // Read live, so turning it on mid-replay finishes the replay at once.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const connLines = CONNECTIONS.map(() => {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('stroke',         'var(--v2-data)');
        line.setAttribute('stroke-width',   '1.1');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('opacity',        '0.95');
        svg.appendChild(line);
        return line;
    });
    const jointDots = Array.from({ length: 21 }, (_, i) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r',            i === 0 ? '2.2' : '1.4');
        c.setAttribute('fill',         'var(--v2-inference)');
        c.setAttribute('stroke',       '#000');
        c.setAttribute('stroke-width', '0.3');
        svg.appendChild(c);
        return c;
    });

    function drawPose(pts) {
        if (!pts) { hidePose(); return; }
        CONNECTIONS.forEach(([a, b], i) => {
            connLines[i].setAttribute('x1', pts[a][0]);
            connLines[i].setAttribute('y1', pts[a][1]);
            connLines[i].setAttribute('x2', pts[b][0]);
            connLines[i].setAttribute('y2', pts[b][1]);
        });
        pts.forEach(([cx, cy], i) => {
            jointDots[i].setAttribute('cx', cx);
            jointDots[i].setAttribute('cy', cy);
        });
    }

    function hidePose() {
        connLines.forEach(l => {
            l.setAttribute('x1','0'); l.setAttribute('y1','0');
            l.setAttribute('x2','0'); l.setAttribute('y2','0');
        });
        jointDots.forEach(d => { d.setAttribute('cx','0'); d.setAttribute('cy','0'); });
    }

    const LOG_TYPE_CLASS = {
        mediapipe:  'v2-demo-log-mediapipe',
        classifier: 'v2-demo-log-classifier',
        buffer:     'v2-demo-log-buffer',
        langgraph:  'v2-demo-log-langgraph',
        out:        'v2-demo-log-out',
    };

    let logCount = 0;
    let _demoTimer = null;

    function addLog(type, msg) {
        const idle = logEl.querySelector('.v2-demo-log-idle');
        if (idle) idle.remove();

        logCount++;
        const line = document.createElement('div');

        const numSpan = document.createElement('span');
        numSpan.className = 'v2-demo-log-num';
        numSpan.textContent = `[${String(logCount).padStart(2,'0')}] `;

        const typeSpan = document.createElement('span');
        typeSpan.className = LOG_TYPE_CLASS[type] || '';
        typeSpan.textContent = `${type} `;

        const msgSpan = document.createElement('span');
        msgSpan.textContent = msg;

        line.append(numSpan, typeSpan, msgSpan);
        logEl.appendChild(line);

        // Keep at most 6 lines visible
        while (logEl.children.length > 6) logEl.removeChild(logEl.firstChild);
    }

    function reset() {
        clearTimeout(_demoTimer);
        _demoTimer = null;
        logCount = 0;
        clearEl(logEl);
        const idle = document.createElement('div');
        idle.className = 'v2-demo-log-idle';
        idle.textContent = '$ waiting for input…';
        logEl.appendChild(idle);

        clearEl(bufferEl);
        bufferEl.appendChild(cursorEl);
        cursorEl.classList.remove('hidden');

        grammarEl.className = 'v2-demo-grammar-box';
        clearEl(grammarEl);
        const waiting = document.createElement('span');
        waiting.className = 'v2-demo-waiting';
        waiting.textContent = 'waiting for buffer…';
        grammarEl.appendChild(waiting);

        outputEl.className = 'v2-demo-output-box';
        clearEl(outputEl);
        const empty = document.createElement('span');
        empty.className = 'v2-demo-output-empty';
        empty.textContent = '\u00a0';
        outputEl.appendChild(empty);

        letterEl.textContent = '';
        letterEl.className = 'v2-demo-sign-letter';
        latencyEl.textContent = '12ms';

        hidePose();
    }

    const LAST_STEP = SCRIPT.length + 2;

    let step  = 0;
    let state = 'idle';   // idle | running | paused | done
    const replayText = replayBtn?.querySelector('.v2-demo-replay-text');
    const replayIcon = replayBtn?.querySelector('svg.icon');

    function setState(next) {
        state = next;
        if (!replayBtn) return;
        const [text, label] = next === 'running' ? ['Pause',  'Pause replay']
                            : next === 'paused'  ? ['Resume', 'Resume replay']
                            :                      ['Replay', 'Replay demo'];
        if (replayText) replayText.textContent = text;
        if (replayIcon) replayIcon.style.display = (next === 'running' || next === 'paused') ? 'none' : '';
        replayBtn.setAttribute('aria-label', label);
    }

    function schedule() { _demoTimer = setTimeout(tick, STEP_MS); }

    function tick() {
        renderStep(step);
        step++;
        if (step <= LAST_STEP) schedule();
        else setState('done');
    }

    function finish() {
        clearTimeout(_demoTimer);
        _demoTimer = null;
        while (step <= LAST_STEP) renderStep(step++);
        setState('done');
    }

    function run() {
        reset();
        step = 0;
        if (motionQuery.matches) { finish(); return; }
        setState('running');
        schedule();
    }

    function renderStep(step) {
        const ch   = SCRIPT[step - 1];
        const sign = (ch && ch !== ' ') ? ch : null;

        // Spaces and the post-replay steps keep the last sign on screen, so the panel
        // is never an empty black box (and with reduced motion it ends on "D")
        if (sign && SIGNS[sign]) drawPose(SIGNS[sign]);

        if (sign) {
            letterEl.textContent = sign;
            letterEl.className = 'v2-demo-sign-letter';
            letterEl.dataset.r = routeFor(sign);
            void letterEl.offsetWidth;
            letterEl.classList.add('pop');
        }

        if (sign) {
            latencyEl.textContent = `${15 + Math.floor(Math.abs(Math.sin(step)) * 5)}ms`;
        }

        if (step >= 1 && step <= SCRIPT.length) {
            const c    = SCRIPT[step - 1];
            const span = document.createElement('span');
            span.textContent = c === ' ' ? '·' : c;
            span.style.color = c === ' ' ? 'var(--v2-text-muted)' : 'var(--v2-text)';
            if (!motionQuery.matches) span.style.animation = `pop ${LETTER_POP_MS}ms var(--spring-bounce)`;
            bufferEl.insertBefore(span, cursorEl);
        }

        if (step === 1) addLog('mediapipe',  'hand detected · 21 landmarks');
        if (step === 3) addLog('classifier', `tf.js → "${SCRIPT[step-1]}" · 96.2%`);
        if (step === 6) addLog('buffer',     'word complete: "HELLO"');
        if (step === SCRIPT.length) addLog('buffer', 'word complete: "WORLD"');

        if (step === SCRIPT.length + 1) {
            addLog('langgraph', 'grammar pass · prototype');

            grammarEl.className = 'v2-demo-grammar-box active';
            clearEl(grammarEl);

            const correcting = document.createElement('span');
            correcting.style.color = 'var(--v2-neural)';
            correcting.textContent = '▸ capitalize · add punctuation · ASL→English reorder';
            const blinkDot = document.createElement('span');
            blinkDot.style.color = 'var(--v2-data)';
            if (!motionQuery.matches) blinkDot.style.animation = 'blink 0.8s step-end infinite';
            blinkDot.textContent = '_';
            grammarEl.append(correcting, blinkDot);

            cursorEl.classList.add('hidden');
        }

        if (step === SCRIPT.length + 2) {
            addLog('out', `"${CORRECTED}"`);

            grammarEl.className = 'v2-demo-grammar-box';
            clearEl(grammarEl);
            const doneSpan = document.createElement('span');
            doneSpan.style.color = 'var(--v2-data)';
            doneSpan.textContent = '✓ 3 rules applied · 11 available';
            grammarEl.appendChild(doneSpan);

            outputEl.className = 'v2-demo-output-box done';
            clearEl(outputEl);
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = '🔊';
            emojiSpan.style.fontSize = '18px';
            const textSpan = document.createElement('span');
            textSpan.textContent = CORRECTED;
            outputEl.append(emojiSpan, textSpan);
        }

    }

    replayBtn?.addEventListener('click', () => {
        if (state === 'running') {
            clearTimeout(_demoTimer);
            _demoTimer = null;
            setState('paused');
        } else if (state === 'paused') {
            setState('running');
            schedule();
        } else {
            run();
        }
    });

    motionQuery.addEventListener('change', e => {
        if (e.matches && (state === 'running' || state === 'paused')) finish();
    });

    const section = svg.closest('section');
    if (!section) return;
    const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { io.disconnect(); run(); }
    }, { threshold: 0.25 });
    io.observe(section);
}
