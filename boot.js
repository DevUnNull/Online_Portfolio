// Boot screen: three S's assemble in the three founders' styles (voxel / single stroke / colour burst),
// then "Super Startup Simulator" with a "Loading world... %" bar. Once per browser session; any key/click skips.
// Loaded in <head> without defer so the page is hidden before first paint.
(function () {
    let seen = false;
    try { seen = sessionStorage.getItem('booted') === '1'; } catch (e) { }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduceMotion) { window.bootDone = true; return; }
    document.documentElement.classList.add('booting');

    const style = document.createElement('style');
    style.textContent = `
        html.booting { overflow: hidden; }
        html.booting body { visibility: hidden; animation: boot-failsafe 0s 6s forwards; } /* never hide the site if this script breaks */
        @keyframes boot-failsafe { to { visibility: visible; } }
        .boot {
            visibility: visible; position: fixed; inset: 0; z-index: 200000;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.6rem;
            background: #020617; color: #f8fafc; font-family: 'VT323', monospace; cursor: pointer;
            transition: opacity 0.5s ease;
        }
        .boot.out { opacity: 0; pointer-events: none; }
        .boot-letters { display: flex; align-items: flex-end; gap: clamp(1rem, 4vw, 2.5rem); height: 96px; }
        .boot-vox { display: grid; grid-template-columns: repeat(5, 12px); gap: 2px; }
        .boot-vox i { width: 12px; height: 12px; background: #38bdf8; opacity: 0; animation: boot-drop 0.35s cubic-bezier(.3,1.6,.6,1) forwards; animation-delay: calc(var(--i) * 18ms); }
        .boot-vox i.off { visibility: hidden; }
        @keyframes boot-drop { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: none; } }
        .boot-line path { fill: none; stroke: #fafafa; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 200; stroke-dashoffset: 200; animation: boot-draw 0.7s ease-in-out 0.55s forwards; }
        @keyframes boot-draw { to { stroke-dashoffset: 0; } }
        .boot-burst { font-size: 170px; line-height: 0.62; opacity: 0;
            background: linear-gradient(135deg, #f472b6, #facc15, #22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent;
            filter: drop-shadow(0 0 18px rgba(244, 114, 182, 0.8)); animation: boot-pop 0.5s cubic-bezier(.3,1.8,.5,1) 1.05s forwards; }
        @keyframes boot-pop { from { opacity: 0; transform: scale(0.2) rotate(-20deg); } to { opacity: 1; transform: none; } }
        .boot-name { font-size: clamp(1.4rem, 4vw, 2.2rem); letter-spacing: 0.3em; text-align: center; opacity: 0; animation: boot-fade 0.5s ease 1.3s forwards; }
        @keyframes boot-fade { to { opacity: 1; } }
        .boot-bar { width: min(320px, 70vw); font-size: 1.1rem; color: #94a3b8; }
        .boot-track { height: 8px; margin-top: 0.4rem; border: 1px solid #334155; }
        .boot-fill { height: 100%; width: 0; background: linear-gradient(90deg, #38bdf8, #fafafa, #f472b6); }
        .boot-skip { font-size: 0.95rem; color: #475569; }
    `;
    document.head.appendChild(style);

    const MIN = 1900, MAX = 4000;
    const start = performance.now();
    let real = 0, ended = false;

    function end() {
        if (ended) return;
        ended = true;
        try { sessionStorage.setItem('booted', '1'); } catch (e) { }
        const boot = document.querySelector('.boot');
        document.documentElement.classList.remove('booting');
        if (typeof lenis !== 'undefined' && lenis) lenis.start(); // index.html's global smooth scroller
        window.bootDone = true;
        window.dispatchEvent(new Event('boot-done'));
        if (boot) { boot.classList.add('out'); setTimeout(() => boot.remove(), 600); }
    }

    window.addEventListener('DOMContentLoaded', () => {
        if (typeof lenis !== 'undefined' && lenis) lenis.stop();
        const sRows = ['#####', '#....', '#....', '#####', '....#', '....#', '#####'];
        const vox = sRows.join('').split('').map((c, i) => `<i style="--i:${i}"${c === '#' ? '' : ' class="off"'}></i>`).join('');
        const boot = document.createElement('div');
        boot.className = 'boot';
        boot.setAttribute('role', 'status');
        boot.setAttribute('data-lenis-prevent', '');
        const vi = document.documentElement.lang === 'vi';
        boot.innerHTML = `
            <div class="boot-letters" aria-hidden="true">
                <div class="boot-vox">${vox}</div>
                <svg class="boot-line" width="56" height="96" viewBox="0 0 56 96"><path d="M46 14 C 36 2, 8 4, 10 24 S 48 44, 46 68 S 14 96, 6 78" pathLength="200"/></svg>
                <span class="boot-burst">S</span>
            </div>
            <div class="boot-name">SUPER STARTUP SIMULATOR</div>
            <div class="boot-bar"><span>${vi ? 'Đang tải thế giới...' : 'Loading world...'} <b class="boot-pct">0</b>%</span><div class="boot-track"><div class="boot-fill"></div></div></div>
            <div class="boot-skip">${vi ? '[ nhấn phím bất kỳ ]' : '[ press any key ]'}</div>`;
        document.body.appendChild(boot);
        boot.addEventListener('click', end);
        window.addEventListener('keydown', end, { once: true });

        // real progress = eager images loaded (lazy ones would never finish while hidden); window load = 100%
        const imgs = [...document.images].filter(img => img.loading !== 'lazy');
        const count = () => { real = imgs.length ? imgs.filter(img => img.complete).length / imgs.length : 1; };
        imgs.forEach(img => { img.addEventListener('load', count); img.addEventListener('error', count); });
        count();
        window.addEventListener('load', () => { real = 1; });

        const pct = boot.querySelector('.boot-pct'), fill = boot.querySelector('.boot-fill');
        (function tick() {
            if (ended) return;
            const elapsed = performance.now() - start;
            // the bar never runs ahead of the real load, and never finishes before the letters have played
            const shown = elapsed > MAX ? 1 : Math.min(real, elapsed / MIN);
            pct.textContent = Math.floor(shown * 100);
            fill.style.width = shown * 100 + '%';
            if (shown >= 1) setTimeout(end, 250);
            else requestAnimationFrame(tick);
        })();
    });
})();
