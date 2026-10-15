// Site-wide achievement toasts. Each unlocks once per browser (localStorage) and queues if several fire together.
(function () {
    const LIST = {
        explorer: { icon: '🏝', en: ['Explorer', 'Discovered all 8 islands'], vi: ['Nhà thám hiểm', 'Đã khám phá hết 8 đảo'] },
        shifter: { icon: '🎭', en: ['Shape Shifter', 'Saw the site as all 3 founders'], vi: ['Đa nhân cách', 'Đã xem web qua cả 3 founder'] },
        scout: { icon: '🤝', en: ['Talent Scout', 'Found the contact page'], vi: ['Săn nhân tài', 'Đã tìm tới phần Liên hệ'] }
    };
    let unlocked = [];
    try { unlocked = JSON.parse(localStorage.getItem('achievements')) || []; } catch (e) { }

    const queue = [];
    let box, busy = false;
    function show() {
        if (busy || !queue.length) return;
        busy = true;
        const a = LIST[queue.shift()];
        const [name, desc] = a[document.documentElement.lang === 'vi' ? 'vi' : 'en'];
        const head = document.documentElement.lang === 'vi' ? 'MỞ KHOÁ THÀNH TỰU' : 'ACHIEVEMENT UNLOCKED';
        box.innerHTML = `<span class="ach-icon">${a.icon}</span><span><small>${head}</small><b>${name}</b><em>${desc}</em></span>`;
        box.classList.add('show');
        setTimeout(() => { box.classList.remove('show'); setTimeout(() => { busy = false; show(); }, 450); }, 3600);
    }
    function unlock(id) {
        if (unlocked.includes(id)) return;
        unlocked.push(id);
        try { localStorage.setItem('achievements', JSON.stringify(unlocked)); } catch (e) { }
        queue.push(id);
        if (window.bootDone) show();
        else window.addEventListener('boot-done', show, { once: true });
    }

    const style = document.createElement('style');
    style.textContent = `
        .ach-toast {
            position: fixed; left: 1.5rem; bottom: 1.5rem; z-index: 99998;
            display: flex; align-items: center; gap: 0.9rem; max-width: calc(100vw - 3rem);
            padding: 0.75rem 1.2rem 0.75rem 0.9rem;
            background: rgba(2, 6, 23, 0.92); border: 1px solid var(--hud, #0ff); box-shadow: 4px 4px 0 var(--hud, #0ff);
            color: var(--cream, #f8fafc); font-family: 'VT323', monospace;
            opacity: 0; transform: translateY(20px); transition: opacity 0.4s ease, transform 0.4s ease; pointer-events: none;
        }
        .ach-toast.show { opacity: 1; transform: none; }
        .ach-icon { font-size: 2rem; }
        .ach-toast small { display: block; font-size: 0.9rem; letter-spacing: 2px; color: var(--hud, #0ff); }
        .ach-toast b { display: block; font-size: 1.5rem; font-weight: 400; line-height: 1; }
        .ach-toast em { display: block; font-style: normal; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: var(--parchment, #94a3b8); }
        @media (max-width: 768px) { .ach-toast { left: 1rem; bottom: 5rem; } }
    `;
    document.head.appendChild(style);

    box = document.createElement('div');
    box.className = 'ach-toast';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);

    window.addEventListener('island-discovered', e => { if (e.detail.found === e.detail.total) unlock('explorer'); });

    const modes = new Set([document.documentElement.dataset.mode]);
    window.addEventListener('founder-mode', e => { modes.add(e.detail); if (modes.size === 3) unlock('shifter'); });

    const contact = document.getElementById('contact');
    if (contact) new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting) { unlock('scout'); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(contact);
})();
