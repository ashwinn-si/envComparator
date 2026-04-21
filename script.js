/**
 * EnvCompare Logic
 * Real-time parsing, comparison, and theme management.
 */

const devInput = document.getElementById('dev-env');
const prodInput = document.getElementById('prod-env');
const missingList = document.getElementById('missing-list');
const missingCount = document.getElementById('missing-count');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

/**
 * Theme Management
 */
const SUN_ICON = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
const MOON_ICON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'light' ? MOON_ICON : SUN_ICON;
    localStorage.setItem('theme', theme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    setTheme(savedTheme || systemTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

/**
 * .env Parsing & Comparison
 */
function parseEnvKeys(text) {
    const keys = new Set();
    const lines = text.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        
        if (line.startsWith('export ')) {
            line = line.substring(7).trim();
        }

        const equalsIndex = line.indexOf('=');
        if (equalsIndex > 0) {
            const key = line.substring(0, equalsIndex).trim();
            if (key) keys.add(key);
        }
    }
    return keys;
}

function compareEnvs() {
    const devKeys = parseEnvKeys(devInput.value);
    const prodKeys = parseEnvKeys(prodInput.value);
    
    const missing = [...devKeys].filter(key => !prodKeys.has(key));
    updateUI(missing);
}

function updateUI(missing) {
    missingCount.textContent = missing.length;
    
    if (missing.length === 0) {
        if (devInput.value.trim() === '' && prodInput.value.trim() === '') {
            missingList.innerHTML = `
                <div class="empty-state">
                    Paste your .env variables to start the comparison.
                </div>
            `;
        } else {
            missingList.innerHTML = `
                <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: rgba(52, 211, 153, 0.05);">
                    ✨ Perfect match! All variables are present in production.
                </div>
            `;
        }
        return;
    }

    missingList.innerHTML = missing.map(key => `
        <div class="missing-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <code>${key}</code>
        </div>
    `).join('');
}

// Global Event Listeners
devInput.addEventListener('input', compareEnvs);
prodInput.addEventListener('input', compareEnvs);

// Initialize
initTheme();
compareEnvs();
