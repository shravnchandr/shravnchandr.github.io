/**
 * demo.js — Scripted ASL Guide pipeline demo.
 *
 * Plays a scripted H-E-L-L-O W-O-R-L-D sequence through the full
 * ASL Guide pipeline: hand landmarks → TF.js classifier → sign buffer
 * → LangGraph grammar pass → spoken output.
 *
 * Fires when the demo section scrolls into view. Replay button resets.
 * Safe DOM updates only — no innerHTML anywhere.
 */

import { SIGNS, CONNECTIONS } from './asl.js';

const NS = 'http://www.w3.org/2000/svg';

const SCRIPT    = ['H','E','L','L','O',' ','W','O','R','L','D'];
const CORRECTED = 'Hello, world!';
const STEP_MS   = 680;

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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
        logCount = 0;
        while (logEl.firstChild) logEl.removeChild(logEl.firstChild);
        const idle = document.createElement('div');
        idle.className = 'v2-demo-log-idle';
        idle.textContent = '$ waiting for input…';
        logEl.appendChild(idle);

        while (bufferEl.firstChild) bufferEl.removeChild(bufferEl.firstChild);
        bufferEl.appendChild(cursorEl);
        cursorEl.classList.remove('hidden');

        grammarEl.className = 'v2-demo-grammar-box';
        while (grammarEl.firstChild) grammarEl.removeChild(grammarEl.firstChild);
        const waiting = document.createElement('span');
        waiting.className = 'v2-demo-waiting';
        waiting.textContent = 'waiting for buffer…';
        grammarEl.appendChild(waiting);

        outputEl.className = 'v2-demo-output-box';
        while (outputEl.firstChild) outputEl.removeChild(outputEl.firstChild);
        const empty = document.createElement('span');
        empty.className = 'v2-demo-output-empty';
        empty.textContent = '\u00a0';
        outputEl.appendChild(empty);

        letterEl.textContent = '';
        letterEl.className = 'v2-demo-sign-letter';
        latencyEl.textContent = '12ms';

        hidePose();
    }

    function run() {
        reset();
        let step = 0;

        function tick() {
            if (step > SCRIPT.length + 2) return;

            const ch   = SCRIPT[step - 1];
            const sign = (ch && ch !== ' ') ? ch : null;

            if (sign && SIGNS[sign]) drawPose(SIGNS[sign]);
            else hidePose();

            if (sign) {
                letterEl.textContent = sign;
                letterEl.className = 'v2-demo-sign-letter';
                void letterEl.offsetWidth;
                letterEl.classList.add('pop');
            } else {
                letterEl.textContent = '';
                letterEl.className = 'v2-demo-sign-letter';
            }

            if (sign) {
                latencyEl.textContent = `${15 + Math.floor(Math.abs(Math.sin(step)) * 5)}ms`;
            }

            if (step >= 1 && step <= SCRIPT.length) {
                const c    = SCRIPT[step - 1];
                const span = document.createElement('span');
                span.textContent = c === ' ' ? '·' : c;
                span.style.color = c === ' ' ? 'var(--v2-text-muted)' : 'var(--v2-text)';
                span.style.animation = 'pop 280ms var(--spring-bounce)';
                bufferEl.insertBefore(span, cursorEl);
            }

            if (step === 1) addLog('mediapipe',  'hand detected · 21 landmarks');
            if (step === 3) addLog('classifier', `tf.js → "${SCRIPT[step-1]}" · 96.2%`);
            if (step === 6) addLog('buffer',     'word complete: "HELLO"');
            if (step === SCRIPT.length) addLog('buffer', 'word complete: "WORLD"');

            if (step === SCRIPT.length + 1) {
                addLog('langgraph', 'grammar pass · 10 rules');

                grammarEl.className = 'v2-demo-grammar-box active';
                while (grammarEl.firstChild) grammarEl.removeChild(grammarEl.firstChild);

                const correcting = document.createElement('span');
                correcting.style.color = 'var(--v2-neural)';
                correcting.textContent = '▸ capitalize · add punctuation · ASL→English reorder';
                const blinkDot = document.createElement('span');
                blinkDot.style.cssText = `color:var(--v2-data);animation:blink 0.8s step-end infinite`;
                blinkDot.textContent = '_';
                grammarEl.append(correcting, blinkDot);

                cursorEl.classList.add('hidden');
            }

            if (step === SCRIPT.length + 2) {
                addLog('out', `"${CORRECTED}"`);

                grammarEl.className = 'v2-demo-grammar-box';
                while (grammarEl.firstChild) grammarEl.removeChild(grammarEl.firstChild);
                const doneSpan = document.createElement('span');
                doneSpan.style.color = 'var(--v2-data)';
                doneSpan.textContent = '✓ 3 rules applied · 10 available';
                grammarEl.appendChild(doneSpan);

                outputEl.className = 'v2-demo-output-box done';
                while (outputEl.firstChild) outputEl.removeChild(outputEl.firstChild);
                const emojiSpan = document.createElement('span');
                emojiSpan.textContent = '🔊';
                emojiSpan.style.fontSize = '18px';
                const textSpan = document.createElement('span');
                textSpan.textContent = CORRECTED;
                outputEl.append(emojiSpan, textSpan);
            }

            step++;
            if (step <= SCRIPT.length + 3) setTimeout(tick, STEP_MS);
        }

        setTimeout(tick, STEP_MS);
    }

    const section = svg.closest('section');
    const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { io.disconnect(); run(); }
    }, { threshold: 0.25 });
    io.observe(section);

    replayBtn.addEventListener('click', run);
}
