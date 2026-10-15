// Founder mode: view the site through Hải (diverse), Nam (minimal) or Hoàng (flashy).
// Loaded in <head> without defer so html[data-mode] is set before first paint.
(function () {
    const MODES = ['hai', 'nam', 'hoang'];
    let mode = 'hai';
    try { mode = MODES.includes(localStorage.getItem('mode')) ? localStorage.getItem('mode') : 'hai'; } catch (e) { }
    document.documentElement.dataset.mode = mode;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function confetti() {
        if (reduceMotion || document.documentElement.dataset.mode !== 'hoang') return;
        const colors = ['#f472b6', '#facc15', '#22d3ee', '#a3e635', '#a78bfa', '#fb923c'];
        for (let i = 0; i < 48; i++) {
            const bit = document.createElement('span');
            bit.className = 'confetti-bit';
            bit.style.background = colors[i % colors.length];
            bit.style.left = 50 + (Math.random() - 0.5) * 30 + 'vw';
            document.body.appendChild(bit);
            const dx = (Math.random() - 0.5) * 70, dy = 40 + Math.random() * 60;
            bit.animate([
                { transform: 'translate(0, 0) rotate(0)', opacity: 1 },
                { transform: `translate(${dx}vw, ${dy}vh) rotate(${Math.random() * 1080}deg)`, opacity: 0 }
            ], { duration: 1400 + Math.random() * 900, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => bit.remove();
        }
    }

    function setMode(next) {
        mode = next;
        document.documentElement.dataset.mode = mode;
        try { localStorage.setItem('mode', mode); } catch (e) { }
        document.querySelectorAll('.mode-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
        window.dispatchEvent(new CustomEvent('founder-mode', { detail: mode }));
        confetti();
    }

    window.addEventListener('island-discovered', confetti);
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.mode-switch button').forEach(b => {
            b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
            b.addEventListener('click', () => setMode(b.dataset.mode));
        });
    });
})();
