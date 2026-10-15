// Boot screen: the three S's of SSS, one per founder, then "Super Startup Simulator" with a "Loading world... %" bar.
//   Hải  = the simulator: a game of Snake whose snake crawls into the S
//   Hoàng = a dragon S shaped like the map of Việt Nam, with Hoàng Sa and Trường Sa
//   Nam  = one clean stroke
// Once per browser session; any key/click skips. Loaded in <head> without defer so the page is hidden before first paint.
(function () {
    let seen = false;
    try { seen = sessionStorage.getItem('booted') === '1'; } catch (e) { }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduceMotion) { window.bootDone = true; return; }
    document.documentElement.classList.add('booting');

    const style = document.createElement('style');
    style.textContent = `
        html.booting { overflow: hidden; }
        html.booting body { visibility: hidden; animation: boot-failsafe 0s 7s forwards; } /* never hide the site if this script breaks */
        @keyframes boot-failsafe { to { visibility: visible; } }
        .boot {
            visibility: visible; position: fixed; inset: 0; z-index: 200000;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.6rem;
            background: #020617; color: #f8fafc; font-family: 'VT323', monospace; cursor: pointer;
            transition: opacity 0.5s ease;
        }
        .boot.out { opacity: 0; pointer-events: none; }
        .boot-letters { display: flex; align-items: flex-end; gap: clamp(1.2rem, 5vw, 3rem); }
        .boot-col { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
        .boot-who { font-size: 1rem; letter-spacing: 2px; color: #64748b; min-height: 1.2em; opacity: 0; animation: boot-fade 0.3s ease forwards; }

        /* Hải */
        .boot-sim { width: 68px; height: 96px; }
        .boot-sim.done { animation: boot-eat 0.35s ease-out; }
        @keyframes boot-eat { from { transform: scale(1.12); filter: brightness(2.2); } }

        /* Hoàng */
        .boot-map { width: 128px; height: auto; overflow: visible; }
        .boot-map .land { fill: url(#bootCandy); fill-opacity: 0; stroke: #f472b6; stroke-width: 1.4; stroke-linejoin: round;
            stroke-dasharray: 200; stroke-dashoffset: 200; filter: drop-shadow(0 0 6px rgba(244, 114, 182, 0.9));
            animation: boot-draw 0.8s ease-in-out 1.0s forwards, boot-fill 0.4s ease 1.7s forwards; }
        @keyframes boot-fill { to { fill-opacity: 1; } }
        .boot-map .eye, .boot-map .isle, .boot-map text { opacity: 0; animation: boot-fade 0.3s ease forwards; }
        .boot-map .eye { animation-delay: 1.85s; }
        .boot-map .isle { fill: #facc15; filter: drop-shadow(0 0 3px #facc15); animation-delay: calc(1.8s + var(--i) * 60ms); }
        .boot-map text { font-family: 'VT323', monospace; font-size: 9px; fill: #fde68a; letter-spacing: 0.5px; animation-delay: 2.2s; }

        /* Nam */
        .boot-line path { fill: none; stroke: #fafafa; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 200; stroke-dashoffset: 200; animation: boot-draw 0.6s ease-in-out 2.0s forwards; }
        @keyframes boot-draw { to { stroke-dashoffset: 0; } }

        .boot-name { font-size: clamp(1.4rem, 4vw, 2.2rem); letter-spacing: 0.3em; text-align: center; opacity: 0; animation: boot-fade 0.5s ease 2.5s forwards; }
        @keyframes boot-fade { to { opacity: 1; } }
        .boot-bar { width: min(320px, 70vw); font-size: 1.1rem; color: #94a3b8; }
        .boot-track { height: 8px; margin-top: 0.4rem; border: 1px solid #334155; }
        .boot-fill { height: 100%; width: 0; background: linear-gradient(90deg, #38bdf8, #f472b6, #fafafa); }
        .boot-skip { font-size: 0.95rem; color: #475569; }
        @media (max-width: 480px) { .boot-letters { transform: scale(0.8); } }
    `;
    document.head.appendChild(style);

    // Hải's S is a game of Snake: the snake crawls the 19 cells of a 5×7 pixel S
    // (top-right → top-left → down → right → down → left), eats the apple at the end and becomes the letter
    const PATH = [[4, 0], [3, 0], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [4, 4], [4, 5], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6]];
    const CELL = 14, SIZE = 12, SNAKE_MS = 900;
    const drawSnake = (ctx, n) => {
        const [ac, ar] = PATH[PATH.length - 1];
        if (n < PATH.length) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(ac * CELL + 6, ar * CELL + 6, 5, 0, 7); ctx.fill(); }
        const done = n >= PATH.length;
        PATH.slice(0, n).forEach(([c, r], i) => {
            ctx.fillStyle = done ? '#38bdf8' : i === n - 1 ? '#bbf7d0' : '#22c55e';
            ctx.fillRect(c * CELL, r * CELL, SIZE, SIZE);
        });
    };

    // simplified outline of Việt Nam as [lon, lat]: north border west→east, coast south to Cà Mau, then the western border back north
    const VN = [[102.14, 22.4], [102.6, 22.75], [103.3, 22.8], [103.97, 22.5], [104.4, 22.8], [104.8, 23.1], [105.33, 23.39], [105.9, 23.0],
        [106.7, 22.85], [106.6, 22.35], [106.75, 22.0], [107.4, 21.65], [108.0, 21.53], [107.4, 21.1], [106.8, 20.75], [106.5, 20.25],
        [106.0, 19.9], [105.75, 19.2], [105.8, 18.7], [106.3, 18.15], [106.6, 17.5], [107.1, 16.85], [107.6, 16.5], [108.25, 16.05],
        [108.8, 15.4], [109.0, 14.6], [109.25, 13.8], [109.3, 13.1], [109.2, 12.25], [109.2, 11.7], [108.9, 11.3], [108.2, 10.9],
        [107.6, 10.6], [107.1, 10.35], [106.75, 10.0], [106.4, 9.55], [106.0, 9.3], [105.5, 8.9], [104.75, 8.6], [104.8, 9.3],
        [105.1, 10.0], [104.45, 10.4], [105.1, 10.95], [105.85, 10.9], [106.15, 11.4], [106.4, 11.9], [106.9, 12.15], [107.5, 12.35],
        [107.6, 13.0], [107.4, 13.9], [107.55, 14.7], [107.3, 15.4], [107.2, 16.1], [106.6, 16.5], [106.2, 17.2], [105.6, 17.9],
        [105.1, 18.6], [104.3, 19.0], [103.9, 19.3], [104.6, 19.9], [104.3, 20.4], [103.6, 20.7], [103.2, 20.8], [102.9, 21.3], [102.7, 21.8]];
    const HOANG_SA = [[111.6, 16.5], [112.3, 16.85], [111.8, 16.0], [112.7, 16.55], [112.0, 16.3]];
    const TRUONG_SA = [[114.3, 11.4], [114.9, 10.7], [113.9, 10.2], [112.9, 9.6], [114.4, 8.8], [115.6, 10.3], [111.9, 8.65]];
    const K = 7, px = ([lon, lat]) => [((lon - 102) * K).toFixed(1), ((23.6 - lat) * K).toFixed(1)];
    const mapSvg = () => {
        const isles = (list, from) => list.map((p, i) => { const [x, y] = px(p); return `<circle class="isle" cx="${x}" cy="${y}" r="1.8" style="--i:${from + i}"/>`; }).join('');
        const [hx, hy] = px([112.2, 17.6]), [tx, ty] = px([113.0, 12.4]), [ex, ey] = px([105.0, 22.5]);
        return `<svg class="boot-map" viewBox="0 0 100 112" aria-hidden="true">
            <defs><linearGradient id="bootCandy" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#f472b6"/><stop offset="0.5" stop-color="#facc15"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
            <path class="land" pathLength="200" d="M${VN.map(p => px(p).join(' ')).join(' L')} Z"/>
            <g class="eye"><circle cx="${ex}" cy="${ey}" r="2.6" fill="#fff"/><circle cx="${+ex + 0.6}" cy="${ey}" r="1.2" fill="#12051f"/></g>
            ${isles(HOANG_SA, 0)}${isles(TRUONG_SA, 5)}
            <text x="${hx}" y="${hy}">HOÀNG SA</text><text x="${tx}" y="${ty}">TRƯỜNG SA</text>
        </svg>`;
    };

    const MIN = 2900, MAX = 4500;
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
        const boot = document.createElement('div');
        boot.className = 'boot';
        boot.setAttribute('role', 'status');
        boot.setAttribute('data-lenis-prevent', '');
        const vi = document.documentElement.lang === 'vi';
        boot.innerHTML = `
            <div class="boot-letters" aria-hidden="true">
                <div class="boot-col"><canvas class="boot-sim"></canvas><span class="boot-who boot-hai-label"></span></div>
                <div class="boot-col">${mapSvg()}<span class="boot-who" style="animation-delay: 1.9s">HOÀNG</span></div>
                <div class="boot-col"><svg class="boot-line" width="56" height="96" viewBox="0 0 56 96"><path d="M46 14 C 36 2, 8 4, 10 24 S 48 44, 46 68 S 14 96, 6 78" pathLength="200"/></svg><span class="boot-who" style="animation-delay: 2.4s">NAM</span></div>
            </div>
            <div class="boot-name">SUPER STARTUP SIMULATOR</div>
            <div class="boot-bar"><span>${vi ? 'Đang tải thế giới...' : 'Loading world...'} <b class="boot-pct">0</b>%</span><div class="boot-track"><div class="boot-fill"></div></div></div>
            <div class="boot-skip">${vi ? '[ nhấn phím bất kỳ ]' : '[ press any key ]'}</div>`;
        document.body.appendChild(boot);
        boot.addEventListener('click', end);
        window.addEventListener('keydown', end, { once: true });

        // Hải: the snake crawls into an S, eats the apple, turns blue
        const label = boot.querySelector('.boot-hai-label');
        const sim = boot.querySelector('.boot-sim'), ctx = sim.getContext('2d'), dpr = window.devicePixelRatio || 1;
        sim.width = 68 * dpr; sim.height = 96 * dpr;
        ctx.scale(dpr, dpr);
        const simStart = performance.now();
        (function play(now) {
            if (ended) return;
            const n = Math.min(PATH.length, Math.floor((now - simStart) / SNAKE_MS * PATH.length) + 1);
            ctx.clearRect(0, 0, 68, 96);
            drawSnake(ctx, n);
            if (n < PATH.length) requestAnimationFrame(play);
            else { sim.classList.add('done'); label.textContent = 'HẢI'; }
        })(simStart);

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
            if (shown >= 1) setTimeout(end, 350);
            else requestAnimationFrame(tick);
        })();
    });
})();
