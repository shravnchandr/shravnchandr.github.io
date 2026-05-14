/**
 * js/recruiter.js — "For Recruiters" quick-reference modal.
 *
 * Opens on #recruiter-btn click. Shows role targets, availability,
 * best-fit teams, and direct links to resume + email.
 * Pure DOM construction — no innerHTML.
 */

import { el as _el, makeOverlay } from './utils.js';

const ROLE_TARGETS = [
    { label: 'Title',        value: 'Senior ML Engineer · L5 / L6 equivalent' },
    { label: 'Location',     value: 'NYC · Remote · Canada (open to relocation)' },
    { label: 'Availability', value: 'Open to interview immediately' },
    { label: 'Focus areas',  value: 'Accessibility AI · Production ML · MLOps · Applied Research' },
];

const TEAM_FITS = [
    {
        company:     'Google',
        color:       '#4285f4',   // Google blue — not a v2 design token
        borderColor: '#4285f440',
        teams:   ['Accessibility (Project Euphonia / Lookout)', 'PAIR', 'Cloud AI / Vertex'],
    },
    {
        company:     'Meta',
        color:       'var(--v2-neural)',
        borderColor: '#7c4dff40',
        teams:   ['FAIR', 'PyTorch / AI Infra', 'AR/VR Accessibility'],
    },
    {
        company:     'Amazon',
        color:       'var(--v2-inference)',
        borderColor: '#ff6d0040',
        teams:   ['Alexa AI', 'AWS ML Platform', 'Devices Accessibility'],
    },
    {
        company:     'Microsoft',
        color:       'var(--v2-data)',
        borderColor: '#00bfa540',
        teams:   ['Azure AI', 'Microsoft Research', 'Accessibility Experiences'],
    },
];

function _buildModal() {
    const overlay = makeOverlay('v2-recruiter-overlay', 'Recruiter quick reference');

    const modal = _el('div', 'v2-recruiter-modal');

    const hdr   = _el('div', 'v2-recruiter-hdr');
    const title = _el('div', 'v2-recruiter-title');
    const tag   = _el('span', 'v2-recruiter-tag'); tag.textContent = '// RECRUITER VIEW';
    const name  = _el('h2',  'v2-recruiter-name'); name.textContent = 'Shravan Chandra';
    title.append(tag, name);

    const close = _el('button', 'v2-panel-close v2-recruiter-close');
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    hdr.append(title, close);
    modal.appendChild(hdr);

    const roleSection = _el('div', 'v2-recruiter-section');
    const roleLabel   = _el('div', 'v2-recruiter-section-label'); roleLabel.textContent = 'ROLE TARGETS';
    roleSection.appendChild(roleLabel);
    ROLE_TARGETS.forEach(({ label, value }) => {
        const row = _el('div', 'v2-recruiter-row');
        const k   = _el('span', 'v2-recruiter-key');   k.textContent = label;
        const v   = _el('span', 'v2-recruiter-val');   v.textContent = value;
        row.append(k, v);
        roleSection.appendChild(row);
    });
    modal.appendChild(roleSection);

    const fitSection = _el('div', 'v2-recruiter-section');
    const fitLabel   = _el('div', 'v2-recruiter-section-label'); fitLabel.textContent = 'BEST-FIT TEAMS';
    fitSection.appendChild(fitLabel);

    const fitGrid = _el('div', 'v2-recruiter-fit-grid');
    TEAM_FITS.forEach(({ company, color, borderColor, teams }) => {
        const card = _el('div', 'v2-recruiter-fit-card');
        card.style.borderColor = borderColor;

        const co  = _el('div', 'v2-recruiter-company');
        co.textContent  = company;
        co.style.color  = color;
        card.appendChild(co);

        teams.forEach(t => {
            const item = _el('div', 'v2-recruiter-team'); item.textContent = t;
            card.appendChild(item);
        });
        fitGrid.appendChild(card);
    });
    fitSection.appendChild(fitGrid);
    modal.appendChild(fitSection);

    const actions = _el('div', 'v2-recruiter-actions');

    const resumeLink = _el('a', 'v2-btn-primary v2-recruiter-resume');
    resumeLink.href     = 'Shravan_Chandra_Resume.pdf';
    resumeLink.download = '';
    const dlIco = _el('span', 'material-symbols-outlined'); dlIco.setAttribute('aria-hidden','true'); dlIco.textContent = 'download';
    const dlTxt = document.createTextNode('Download Resume');
    resumeLink.append(dlIco, dlTxt);

    const emailLink = _el('a', 'v2-btn-secondary v2-recruiter-email');
    emailLink.href = 'mailto:shravnchandr@gmail.com';
    const mlIco = _el('span', 'material-symbols-outlined'); mlIco.setAttribute('aria-hidden','true'); mlIco.textContent = 'mail';
    const mlTxt = document.createTextNode('shravnchandr@gmail.com');
    emailLink.append(mlIco, mlTxt);

    actions.append(resumeLink, emailLink);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    return overlay;
}

function _open(overlay) {
    overlay.classList.add('v2-recruiter-overlay--open');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.querySelector('.v2-recruiter-close').focus();
}

function _close(overlay) {
    overlay.classList.remove('v2-recruiter-overlay--open');
    overlay.setAttribute('aria-hidden', 'true');
}

export function initRecruiter() {
    const btn = document.getElementById('recruiter-btn');
    if (!btn) return;

    const overlay = _buildModal();
    document.body.appendChild(overlay);

    btn.addEventListener('click', () => _open(overlay));

    overlay.addEventListener('click', e => {
        if (e.target === overlay) _close(overlay);
    });

    overlay.querySelector('.v2-recruiter-close')
        .addEventListener('click', () => _close(overlay));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('v2-recruiter-overlay--open')) {
            _close(overlay);
        }
    });
}
