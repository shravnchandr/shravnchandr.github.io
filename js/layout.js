/**
 * js/layout.js — responsive placement that CSS alone can't do.
 *
 * On single-column layouts the hero's ASL demo card would sit between the
 * hiring snapshot and the project overview, pushing the strongest work down.
 * It moves to #overview-demo-slot (end of the "At a glance" section) and back
 * into the hero when the layout widens. Moving the node keeps its listeners,
 * IDs and observers, so asl.js and webcam.js carry on unaffected.
 * hero.css hides the card inside the hero at the same breakpoint, so it never
 * flashes there first.
 */

const SINGLE_COLUMN = '(max-width: 1024px)';   // matches the hero breakpoint in hero.css

export function initHeroDemoPlacement() {
    const card  = document.querySelector('.v2-hero-right');
    const slot  = document.getElementById('overview-demo-slot');
    const home  = document.querySelector('.v2-hero-inner');
    const glance = home && home.querySelector('.v2-glance');
    if (!card || !slot || !home) return;

    const mq = window.matchMedia(SINGLE_COLUMN);
    const place = () => {
        if (mq.matches) {
            if (card.parentElement !== slot) slot.appendChild(card);
        } else if (card.parentElement !== home) {
            home.insertBefore(card, glance);   // back to its desktop spot, before the snapshot
        }
    };
    place();
    mq.addEventListener('change', place);
}
