/**
 * EnvCompare Logic
 * Real-time parsing, comparison, and theme management.
 */

const devInput = document.getElementById('dev-env');
const prodInput = document.getElementById('prod-env');
const detailContent = document.getElementById('detail-content');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const navButtons = document.querySelectorAll('.nav-btn');

let currentTab = 'missing-prod';
let comparisonData = {
    isEmpty: true,
    missingInProd: [],
    missingInDev: [],
    valueMismatches: [],
    devDupes: [],
    prodDupes: []
};

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
function parseEnv(text) {
    const unique = new Map();
    const duplicates = new Set();
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
            const value = line.substring(equalsIndex + 1).trim();
            if (key) {
                if (unique.has(key)) {
                    duplicates.add(key);
                } else {
                    unique.set(key, value);
                }
            }
        }
    }
    return { unique, duplicates: [...duplicates] };
}

function compareEnvs() {
    const devParser = parseEnv(devInput.value);
    const prodParser = parseEnv(prodInput.value);
    
    const devMap = devParser.unique;
    const prodMap = prodParser.unique;
    
    comparisonData = {
        isEmpty: devInput.value.trim() === '' && prodInput.value.trim() === '',
        missingInProd: [],
        missingInDev: [],
        valueMismatches: [],
        devDupes: devParser.duplicates,
        prodDupes: prodParser.duplicates
    };

    for (const [key, devValue] of devMap.entries()) {
        if (!prodMap.has(key)) {
            comparisonData.missingInProd.push(key);
        } else {
            const prodValue = prodMap.get(key);
            if (devValue !== prodValue) {
                comparisonData.valueMismatches.push({ key, devValue, prodValue });
            }
        }
    }
    
    for (const key of prodMap.keys()) {
        if (!devMap.has(key)) {
            comparisonData.missingInDev.push(key);
        }
    }

    updateBadges();
    renderTab();
}

function updateBadges() {
    document.getElementById('badge-missing-prod').textContent = comparisonData.missingInProd.length;
    document.getElementById('badge-missing-dev').textContent = comparisonData.missingInDev.length;
    document.getElementById('badge-diff-values').textContent = comparisonData.valueMismatches.length;
    document.getElementById('badge-dupes').textContent = comparisonData.devDupes.length + comparisonData.prodDupes.length;
}

function renderTab() {
    if (comparisonData.isEmpty) {
        detailContent.innerHTML = `
            <div class="empty-state">
                Paste your .env variables to start the comparison.
            </div>
        `;
        return;
    }

    let html = '';

    if (currentTab === 'missing-prod') {
        html = renderList(comparisonData.missingInProd, 'danger-icon', '✨ Perfect match! No variables missing in production.');
    } else if (currentTab === 'missing-dev') {
        html = renderList(comparisonData.missingInDev, 'blue-icon', '✨ Clean environment! No extra variables in production.');
    } else if (currentTab === 'diff-values') {
        html = renderValueMismatches();
    } else if (currentTab === 'dupes') {
        html = renderDupes();
    }

    detailContent.innerHTML = html;
}

function getIconSvg() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>`;
}

function renderList(items, iconClass, emptyMessage) {
    if (items.length === 0) {
        return `
            <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: rgba(52, 211, 153, 0.05);">
                ${emptyMessage}
            </div>
        `;
    }

    return `
        <div class="missing-list">
            ${items.map(key => `
                <div class="missing-item ${iconClass}">
                    ${getIconSvg()}
                    <code>${key}</code>
                </div>
            `).join('')}
        </div>
    `;
}

function renderValueMismatches() {
    const items = comparisonData.valueMismatches;
    if (items.length === 0) {
        return `
            <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: rgba(52, 211, 153, 0.05);">
                ✨ Synchronization complete! All matching variables have identical values.
            </div>
        `;
    }

    return `
        <div class="diff-list">
            ${items.map(item => `
                <div class="diff-item">
                    <div class="diff-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        ${item.key}
                    </div>
                    <div class="diff-values-grid">
                        <div class="diff-col">
                            <span class="diff-label">Development</span>
                            <div class="diff-val">${escapeHtml(item.devValue)}</div>
                        </div>
                        <div class="diff-col">
                            <span class="diff-label">Production</span>
                            <div class="diff-val">${escapeHtml(item.prodValue)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDupes() {
    const dev = comparisonData.devDupes;
    const prod = comparisonData.prodDupes;
    const total = dev.length + prod.length;

    if (total === 0) {
        return `
            <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: rgba(52, 211, 153, 0.05);">
                ✨ No duplicates found in any environment!
            </div>
        `;
    }

    let itemsHtml = '';
    
    dev.forEach(key => {
        itemsHtml += `
            <div class="missing-item yellow-icon">
                ${getIconSvg()}
                <code>${key}</code>
                <span class="dupe-tag">DEV</span>
            </div>
        `;
    });

    prod.forEach(key => {
        itemsHtml += `
            <div class="missing-item yellow-icon">
                ${getIconSvg()}
                <code>${key}</code>
                <span class="dupe-tag">PROD</span>
            </div>
        `;
    });

    return `<div class="missing-list">${itemsHtml}</div>`;
}

function escapeHtml(text) {
    const fn = (a) => {
        const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escapes[a];
    };
    return text.replace(/[&<>"']/g, fn);
}

// Navigation Events
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.getAttribute('data-tab');
        renderTab();
    });
});

// Global Event Listeners
devInput.addEventListener('input', compareEnvs);
prodInput.addEventListener('input', compareEnvs);

// Initialize
initTheme();
compareEnvs();
