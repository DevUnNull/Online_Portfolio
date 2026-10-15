// The world below the hero: falling through a voxel cloud layer into a night sky, a zone minimap,
// the tech inventory and the quest path. Loaded with defer, after GSAP/ScrollTrigger.
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasST = !!(window.gsap && window.ScrollTrigger);
    if (hasST) gsap.registerPlugin(ScrollTrigger);

    // ---------- cloud dive: three canvas layers of voxel cloud clumps, the nearer the faster ----------
    const band = document.querySelector('.cloud-dive');
    if (band && !document.documentElement.classList.contains('world-3d')) { // 2D fallback only when there is no WebGL world
        const LAYERS = [{ size: 16, alpha: 0.35, count: 26, speed: 0.4 }, { size: 26, alpha: 0.6, count: 16, speed: 0.8 }, { size: 42, alpha: 0.92, count: 9, speed: 1.4 }];
        const canvases = LAYERS.map(() => band.appendChild(document.createElement('canvas')));
        // fixed seed so the clouds don't reshuffle on every resize
        let seed = 7;
        const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const clumps = LAYERS.map(l => Array.from({ length: l.count }, () => ({
            x: rand(), y: 0.15 + rand() * 0.7,
            rows: Array.from({ length: 2 + Math.floor(rand() * 3) }, (_, r) => [Math.floor(rand() * 2) - r % 2, 3 + Math.floor(rand() * 5)])
        })));

        const draw = () => {
            const css = getComputedStyle(document.documentElement);
            const colors = css.getPropertyValue('--cloud').split(',').map(c => c.trim()).filter(Boolean);
            const outline = css.getPropertyValue('--cloud-outline').trim() === '1';
            const w = band.clientWidth, h = band.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvases.forEach((cv, li) => {
                const { size, alpha } = LAYERS[li];
                cv.width = w * dpr; cv.height = h * dpr;
                const ctx = cv.getContext('2d');
                ctx.scale(dpr, dpr);
                ctx.globalAlpha = alpha;
                clumps[li].forEach((c, ci) => {
                    const color = colors[ci % colors.length] || '#e0f2fe';
                    c.rows.forEach(([offset, len], r) => {
                        for (let i = 0; i < len; i++) {
                            const x = c.x * w + (offset + i) * size - (len * size) / 2, y = c.y * h - r * size;
                            if (outline) { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1); continue; }
                            ctx.fillStyle = color; ctx.fillRect(x, y, size - 1, size - 1);
                            ctx.fillStyle = 'rgba(15, 23, 42, 0.18)'; ctx.fillRect(x, y + size * 0.7, size - 1, size * 0.3 - 1); // voxel underside
                        }
                    });
                });
            });
        };
        draw();
        let resizeTimer;
        window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(draw, 150); });
        window.addEventListener('founder-mode', draw);

        if (hasST && !reduceMotion) canvases.forEach((cv, i) => gsap.fromTo(cv, { yPercent: 25 * LAYERS[i].speed }, {
            yPercent: -25 * LAYERS[i].speed, ease: 'none',
            scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true }
        }));
    }

    // ---------- inventory: slots are tabs (click, or arrow keys between slots) ----------
    const slots = [...document.querySelectorAll('.inv-slot')];
    const select = slot => {
        slots.forEach(s => {
            const on = s === slot;
            s.setAttribute('aria-selected', String(on));
            s.tabIndex = on ? 0 : -1;
            document.getElementById(s.getAttribute('aria-controls')).hidden = !on;
        });
    };
    slots.forEach((slot, i) => {
        slot.addEventListener('click', () => select(slot));
        slot.addEventListener('keydown', e => {
            const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            if (!step) return;
            e.preventDefault();
            const next = slots[(i + step + slots.length) % slots.length];
            select(next);
            next.focus();
        });
    });

    // ---------- quest path: the line fills and nodes light up as you scroll through ----------
    const quests = document.querySelector('.quests');
    if (quests && hasST) {
        ScrollTrigger.create({
            trigger: quests, start: 'top 70%', end: 'bottom 70%',
            onUpdate: self => quests.style.setProperty('--progress', self.progress.toFixed(3))
        });
        quests.querySelectorAll('.quest').forEach((q, i) => {
            ScrollTrigger.create({ trigger: q, start: 'top 70%', onEnter: () => q.classList.add('reached'), onLeaveBack: () => q.classList.remove('reached') });
            if (!reduceMotion) gsap.from(q.querySelector('.quest-card'), {
                x: i % 2 ? 40 : -40, opacity: 0, duration: 0.7, ease: 'power2.out',
                scrollTrigger: { trigger: q, start: 'top 80%' }
            });
        });
    } else if (quests) {
        quests.style.setProperty('--progress', 1);
        quests.querySelectorAll('.quest').forEach(q => q.classList.add('reached'));
    }

    // ---------- minimap: every section is a zone of the world ----------
    const ZONES = [['home', 'WORLD'], ['objective', 'ABOUT'], ['studio-team', 'TEAM'], ['projects', 'GAMES'],
        ['skills', 'INVENTORY'], ['education', 'QUESTS'], ['contact', 'CONTACT']].filter(([id]) => document.getElementById(id));
    const map = document.createElement('nav');
    map.className = 'minimap';
    map.setAttribute('aria-label', 'Zones');
    map.innerHTML = ZONES.map(([id, label], i) => `<a href="#${id}" data-zone="${id}"><span>${String(i).padStart(2, '0')} ${label}</span><i></i></a>`).join('');
    document.body.appendChild(map);
    const setZone = id => map.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.zone === id));
    setZone('home');
    if (hasST) {
        ZONES.forEach(([id]) => ScrollTrigger.create({
            trigger: '#' + id, start: 'top center', end: 'bottom center',
            onToggle: self => { if (self.isActive) setZone(id); }
        }));
        // only shows once you've left the island hero, where it would cover the scene
        ScrollTrigger.create({ trigger: '.parallax-wrapper', start: 'top 60%', onToggle: self => map.classList.toggle('show', self.isActive) });
    } else {
        map.classList.add('show');
    }
})();
