(function() {
    // 1. Determine active language (default to English)
    let currentLang = localStorage.getItem('lang') || 'en';
    
    // Ensure standard HTML lang matches
    document.documentElement.setAttribute('lang', currentLang);

    // Inject language switcher CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Display toggles based on active language */
        html[lang="en"] .lang-vi { display: none !important; }
        html[lang="vi"] .lang-en { display: none !important; }

        /* Universal fixed floating switcher container */
        .lang-switcher-container {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 99999;
            display: inline-flex;
            align-items: center;
        }

        .lang-switcher-btn {
            font-family: 'Lora', serif;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            border: 1px solid #4a3028; /* var(--border-mid) equivalent */
            background: rgba(13, 10, 7, 0.88); /* var(--dark-bg) equivalent with blur */
            color: #ddd0b8; /* var(--cream) equivalent */
            cursor: pointer;
            display: inline-flex;
            gap: 6px;
            align-items: center;
            transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6), 0 0 10px rgba(196, 30, 58, 0.3);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            user-select: none;
        }

        .lang-switcher-btn:hover {
            border-color: #c41e3a; /* var(--crimson) equivalent */
            color: #ffffff;
            box-shadow: 0 4px 20px rgba(196, 30, 58, 0.5), 0 0 15px rgba(196, 30, 58, 0.4);
            transform: translateY(-2px);
        }

        .lang-switcher-btn span {
            opacity: 0.4;
            transition: opacity 0.3s ease;
        }

        .lang-switcher-btn span.active-lang {
            opacity: 1;
            color: #e8c060; /* var(--bright-gold) equivalent */
            text-shadow: 0 0 5px rgba(232, 192, 96, 0.3);
        }

        @media (max-width: 768px) {
            .lang-switcher-container {
                bottom: 1.5rem;
                right: 1.5rem;
            }
        }
    `;
    document.head.appendChild(style);

    // Helper to update attribute translations
    function updateAttributes(lang) {
        document.querySelectorAll('[data-en][data-vi]').forEach(el => {
            const translation = el.getAttribute(`data-${lang}`);
            if (!translation) return;

            if (el.tagName === 'TITLE') {
                document.title = translation;
            } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else if (el.tagName === 'IMG') {
                el.alt = translation;
            } else {
                el.textContent = translation;
            }
        });
    }

    // Initialize switcher UI
    function initSwitcher() {
        // Create switcher HTML
        const container = document.createElement('div');
        container.className = 'lang-switcher-container';

        const button = document.createElement('button');
        button.className = 'lang-switcher-btn';
        button.setAttribute('aria-label', 'Toggle Language');
        button.innerHTML = `
            <span class="${currentLang === 'en' ? 'active-lang' : ''}">EN</span>
            <span style="opacity: 0.3; margin: 0 2px;">/</span>
            <span class="${currentLang === 'vi' ? 'active-lang' : ''}">VI</span>
        `;

        button.addEventListener('click', () => {
            const nextLang = currentLang === 'en' ? 'vi' : 'en';
            currentLang = nextLang;
            localStorage.setItem('lang', currentLang);
            document.documentElement.setAttribute('lang', currentLang);

            // Update button UI
            button.querySelector('span:first-child').className = currentLang === 'en' ? 'active-lang' : '';
            button.querySelector('span:last-child').className = currentLang === 'vi' ? 'active-lang' : '';

            // Update attributes
            updateAttributes(currentLang);
        });

        container.appendChild(button);

        // Append switcher globally directly to the body
        document.body.appendChild(container);
    }

    // Execute setup
    window.addEventListener('DOMContentLoaded', () => {
        updateAttributes(currentLang);
        initSwitcher();
    });
})();
