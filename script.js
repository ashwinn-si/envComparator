/**
 * EnvCompare Core Logic
 * Real-time parsing, advanced side-by-side comparison, security linter,
 * drag-and-drop, theme toggle, secret masking, file exports, and presets.
 */

// DOM Elements
const devInput = document.getElementById('dev-env');
const prodInput = document.getElementById('prod-env');
const detailContent = document.getElementById('detail-content');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const navButtons = document.querySelectorAll('.nav-btn');

// File Upload Elements
const devFileInput = document.getElementById('dev-file-input');
const prodFileInput = document.getElementById('prod-file-input');
const devFileNameLabel = document.getElementById('dev-file-name');
const prodFileNameLabel = document.getElementById('prod-file-name');
const devClearBtn = document.getElementById('dev-clear');
const prodClearBtn = document.getElementById('prod-clear');
const devDropZone = document.getElementById('dev-drop-zone');
const prodDropZone = document.getElementById('prod-drop-zone');

// Stats Elements
const statDevCount = document.getElementById('stat-dev-count');
const statProdCount = document.getElementById('stat-prod-count');
const statSyncPercent = document.getElementById('stat-sync-percent');
const statSyncBar = document.getElementById('stat-sync-bar');
const statSecurityScore = document.getElementById('stat-security-score');
const statSecurityCard = document.getElementById('stat-security-card');

// Preset Buttons
const presetBtns = document.querySelectorAll('.preset-btn');

// Controls Panel
const maskSecretsToggle = document.getElementById('mask-secrets-toggle');
const actionClearAll = document.getElementById('action-clear-all');
const actionCleanSort = document.getElementById('action-clean-sort');
const actionSyncMissing = document.getElementById('action-sync-missing');
const actionDownloadMerged = document.getElementById('action-download-merged');

// Search & Filter
const resultsSearch = document.getElementById('results-search');
const diffFilter = document.getElementById('diff-filter');
const searchContainer = document.getElementById('search-container');

// App State
let currentTab = 'unified-diff';
let showMasked = false;
let manuallyUnmaskedKeys = new Set();
let parsedDev = { unique: new Map(), duplicates: [], order: [], comments: new Map() };
let parsedProd = { unique: new Map(), duplicates: [], order: [], comments: new Map() };
let comparisonStats = { devCount: 0, prodCount: 0, syncPercent: 0, securityScore: 100 };
let linterIssues = [];

// Icons SVGs
const MOON_ICON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
const SUN_ICON = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

const EYE_OFF_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
const EYE_ON_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

const CHECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const ERROR_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
const WARNING_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
const INFO_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

// Preset Datasets
const DEMO_PRESETS = {
  nextjs: {
    dev: `# Next.js Starter - Local Development Env
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_app_dev"
DB_TIMEOUT=5000

# Security (Weak developer keys)
JWT_SECRET="dev-insecure-key-123456"
STRIPE_SECRET_KEY="sk_test_51NzABC123456"

# Exposed client variables
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Warning: Duplicate key!
PORT=3001
`,
    prod: `# Next.js Starter - Production Variables
NODE_ENV=production

# Production Database (Exposes weak password & HTTP URL)
DATABASE_URL="http://postgres:123456@db-server.internal:5432/my_app_prod"

# Security risk: Exposed credential in client public variable!
NEXT_PUBLIC_STRIPE_SECRET_KEY="sk_live_insecure_client_secret_xyz"

# Additional Production Keys
ANOTHER_PROD_KEY="prod_special_val"
`
  },
  laravel: {
    dev: `# Laravel Application Development Config
APP_NAME=LaravelApp
APP_ENV=local
APP_KEY=base64:devAppKeyString12345=
APP_DEBUG=true
APP_URL=http://localhost

# Database Connections
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_dev
DB_USERNAME=root
DB_PASSWORD=secret

# External integrations
stripe_key=pk_test_stripe123
`,
    prod: `# Laravel Application Production Config
APP_NAME="Laravel Application"
APP_ENV=production
APP_KEY=base64:prodAppKeyString54321=
APP_DEBUG=false
APP_URL=https://laravel-production.com

DB_CONNECTION=mysql
DB_HOST=10.0.0.15
DB_PORT=3306
DB_DATABASE=laravel_prod
DB_USERNAME=admin
DB_PASSWORD=password
`
  },
  django: {
    dev: `# Django Server Settings
DEBUG=True
SECRET_KEY="django-insecure-n(v&i!%h08j=a#4+52z0p5y+)"
DATABASE_URL="sqlite:///db.sqlite3"
ALLOWED_HOSTS="*"

# Duplicate definition
DEBUG=False
`,
    prod: `# Django Server Settings
DEBUG=False
SECRET_KEY="django-insecure-n(v&i!%h08j=a#4+52z0p5y+)"
DATABASE_URL="postgres://django_user:prod_db_pass_998@db.django-host.com:5432/db"
`
  }
};

/**
 * Theme Management
 */
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
 * Dynamic Toast Notifications
 */
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = CHECK_ICON;
  if (type === 'warning') icon = WARNING_ICON;
  if (type === 'danger') icon = ERROR_ICON;
  if (type === 'info') icon = INFO_ICON;
  
  toast.innerHTML = `
    ${icon}
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Slide out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px) scale(0.95)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Advanced .env Parsing
 */
function parseEnv(text) {
  const unique = new Map();
  const duplicates = [];
  const order = [];
  const comments = new Map(); // Associate comments with keys
  
  const lines = text.split('\n');
  let pendingComments = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track Comments
    if (line.startsWith('#')) {
      pendingComments.push(line);
      continue;
    }
    
    if (!line) {
      pendingComments = []; // Reset on blank lines
      continue;
    }
    
    // Strip "export " prefix
    let cleanLine = line;
    if (cleanLine.startsWith('export ')) {
      cleanLine = cleanLine.substring(7).trim();
    }
    
    const equalsIndex = cleanLine.indexOf('=');
    if (equalsIndex > 0) {
      const key = cleanLine.substring(0, equalsIndex).trim();
      let value = cleanLine.substring(equalsIndex + 1).trim();
      
      // Clean string quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      if (key) {
        if (unique.has(key)) {
          duplicates.push({ key, lineNum: i + 1, value });
        } else {
          unique.set(key, value);
          order.push(key);
          if (pendingComments.length > 0) {
            comments.set(key, [...pendingComments]);
            pendingComments = [];
          }
        }
      }
    }
  }
  
  return { unique, duplicates, order, comments };
}

/**
 * Health Check & Security Linter Engine
 */
function lintEnvironments() {
  linterIssues = [];
  let score = 100;
  
  const devMap = parsedDev.unique;
  const prodMap = parsedProd.unique;
  
  const rules = {
    // 1. Secret leaked in client bundles
    exposedSecrets: [],
    // 2. Cleartext / Weak production credentials
    criticalErrors: [],
    // 3. Duplicate checks & code quality issues
    codeQuality: []
  };

  // Rule: Duplicate Keys check
  parsedDev.duplicates.forEach(dupe => {
    rules.codeQuality.push({
      title: "Duplicate Variable in Development",
      desc: `Key <code>${dupe.key}</code> is defined multiple times. Duplicate values override each other unexpectedly.`,
      severity: "warning",
      key: dupe.key
    });
    score -= 3;
  });
  
  parsedProd.duplicates.forEach(dupe => {
    rules.criticalErrors.push({
      title: "Duplicate Variable in Production",
      desc: `Key <code>${dupe.key}</code> is declared multiple times in Production.`,
      severity: "danger",
      key: dupe.key
    });
    score -= 5;
  });

  // Check Dev variables
  devMap.forEach((val, key) => {
    // Standard capitalization check
    if (key !== key.toUpperCase() || !/^[A-Z0-9_]+$/.test(key)) {
      rules.codeQuality.push({
        title: "Variable name not in UPPER_SNAKE_CASE (Dev)",
        desc: `Variable <code>${key}</code> should follow convention standards.`,
        severity: "info",
        key
      });
      score -= 1;
    }
  });

  // Check Production variables
  prodMap.forEach((val, key) => {
    // Empty Value
    if (!val) {
      rules.codeQuality.push({
        title: "Blank Production Variable",
        desc: `Key <code>${key}</code> exists in Production but has no value.`,
        severity: "warning",
        key
      });
      score -= 3;
      return;
    }

    // Standard capitalization check
    if (key !== key.toUpperCase() || !/^[A-Z0-9_]+$/.test(key)) {
      rules.codeQuality.push({
        title: "Variable name not in UPPER_SNAKE_CASE (Prod)",
        desc: `Variable <code>${key}</code> in production does not follow standard conventions.`,
        severity: "info",
        key
      });
      score -= 1;
    }

    // Exposed secrets rule: NEXT_PUBLIC_ / VITE_ etc. containing sensitive keywords
    const publicClientPrefixes = ["NEXT_PUBLIC_", "VITE_", "NUXT_PUBLIC_", "MIX_"];
    const hasPublicPrefix = publicClientPrefixes.some(pref => key.startsWith(pref));
    const isSensitiveWord = ["SECRET", "PASSWORD", "KEY", "PRIVATE", "TOKEN", "CREDENTIAL"].some(word => key.includes(word));
    
    if (hasPublicPrefix && isSensitiveWord) {
      rules.exposedSecrets.push({
        title: "Critical Client Leak Risk",
        desc: `Public variable <code>${key}</code> contains high-risk keywords in production. Client-accessible variables are exposed in web bundles!`,
        severity: "danger",
        key
      });
      score -= 20;
    }

    // HTTP links in Production
    if (val.startsWith("http://") && !val.includes("localhost") && !val.includes("127.0.0.1")) {
      rules.criticalErrors.push({
        title: "Unsecured HTTP Connection in Production",
        desc: `Production key <code>${key}</code> is configured with unsecure HTTP (<code>${val}</code>). Always utilize HTTPS in production.`,
        severity: "danger",
        key
      });
      score -= 10;
    }

    // Weak Passwords/Passwords matching default terms
    const weakPasswords = ["password", "123456", "admin", "root", "secret", "null", "undefined", "12345", "12345678"];
    const isCredentialsField = ["PASS", "SECRET", "KEY", "TOKEN", "PWD"].some(word => key.includes(word));
    
    if (isCredentialsField) {
      const normalizedVal = val.toLowerCase();
      if (weakPasswords.includes(normalizedVal) || normalizedVal === key.toLowerCase()) {
        rules.criticalErrors.push({
          title: "Weak Production Password",
          desc: `Critical key <code>${key}</code> uses a weak, easily-guessable credential (<code>${val}</code>).`,
          severity: "danger",
          key
        });
        score -= 15;
      }
    }
  });

  // Format issues into flattened array
  const formattedIssues = [];
  let issueCount = 0;
  
  Object.keys(rules).forEach(cat => {
    rules[cat].forEach(issue => {
      issue.category = cat;
      formattedIssues.push(issue);
      if (issue.severity === "danger" || issue.severity === "warning") {
        issueCount++;
      }
    });
  });

  linterIssues = formattedIssues;
  comparisonStats.securityScore = Math.max(0, score);
  
  // Update Security Score badge UI
  const badgeLinter = document.getElementById('badge-linter');
  badgeLinter.textContent = issueCount;
  badgeLinter.className = issueCount > 0 ? "badge badge-warning" : "badge";
  
  statSecurityScore.textContent = `${comparisonStats.securityScore}/100`;
  
  // Dynamic Score styling colors
  statSecurityCard.className = "stat-card";
  if (comparisonStats.securityScore >= 85) {
    statSecurityScore.className = "stat-value text-success";
  } else if (comparisonStats.securityScore >= 60) {
    statSecurityScore.className = "stat-value text-warning";
    statSecurityCard.classList.add("warning-border");
  } else {
    statSecurityScore.className = "stat-value text-danger";
    statSecurityCard.classList.add("danger-border");
  }
}

/**
 * Secret Masking Engine
 */
function getMaskedString(key, val) {
  if (!showMasked || !val) return val;
  if (manuallyUnmaskedKeys.has(key)) return val;
  
  // Determine if it looks like a secret, or mask everything in mask secrets mode
  const looksLikeSecret = ["KEY", "PASS", "SECRET", "TOKEN", "AUTH", "DATABASE", "URL", "JWT", "SALT", "PWD"].some(word => key.includes(word));
  
  if (looksLikeSecret) {
    return "••••••••";
  }
  return val;
}

function escapeHtml(text) {
  if (!text) return "";
  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, (a) => escapes[a]);
}

/**
 * Run Comparisons
 */
function updateComparison() {
  parsedDev = parseEnv(devInput.value);
  parsedProd = parseEnv(prodInput.value);
  
  const devMap = parsedDev.unique;
  const prodMap = parsedProd.unique;
  
  // Total Keys Count
  comparisonStats.devCount = devMap.size;
  comparisonStats.prodCount = prodMap.size;
  
  statDevCount.textContent = comparisonStats.devCount;
  statProdCount.textContent = comparisonStats.prodCount;
  
  // Compare Keys
  let totalKeys = new Set([...devMap.keys(), ...prodMap.keys()]);
  let matches = 0;
  
  let missingInProd = [];
  let missingInDev = [];
  let valueMismatches = [];
  
  totalKeys.forEach(key => {
    const inDev = devMap.has(key);
    const inProd = prodMap.has(key);
    
    if (inDev && inProd) {
      if (devMap.get(key) === prodMap.get(key)) {
        matches++;
      } else {
        valueMismatches.push({
          key,
          devVal: devMap.get(key),
          prodVal: prodMap.get(key)
        });
      }
    } else if (inDev) {
      missingInProd.push(key);
    } else {
      missingInDev.push(key);
    }
  });
  
  // Health sync ratio calculation
  const totalCompareCount = totalKeys.size;
  comparisonStats.syncPercent = totalCompareCount > 0 
    ? Math.round((matches / totalCompareCount) * 100) 
    : 0;
    
  statSyncPercent.textContent = `${comparisonStats.syncPercent}%`;
  statSyncBar.style.width = `${comparisonStats.syncPercent}%`;
  
  // Badges update
  document.getElementById('badge-missing-prod').textContent = missingInProd.length;
  document.getElementById('badge-missing-dev').textContent = missingInDev.length;
  document.getElementById('badge-diff-values').textContent = valueMismatches.length;
  document.getElementById('badge-dupes').textContent = parsedDev.duplicates.length + parsedProd.duplicates.length;
  
  lintEnvironments();
  renderTab();
}

/**
 * Renderer for each tab results view
 */
function renderTab() {
  const isEmpty = devInput.value.trim() === '' && prodInput.value.trim() === '';
  
  // Display search container only if results tab allows search
  if (currentTab === 'unified-diff' && !isEmpty) {
    searchContainer.style.display = 'flex';
  } else {
    searchContainer.style.display = 'none';
  }

  if (isEmpty) {
    detailContent.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>No environment variables detected</span>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Paste or upload `.env` contents to visualize comparative analytics.</p>
      </div>
    `;
    return;
  }

  const query = resultsSearch.value.toLowerCase().trim();
  const filterType = diffFilter.value;
  
  let html = '';

  switch(currentTab) {
    case 'unified-diff':
      html = renderUnifiedDiff(query, filterType);
      break;
    case 'missing-prod':
      html = renderMissingList(getFilteredKeys(Array.from(parsedDev.unique.keys()).filter(k => !parsedProd.unique.has(k)), query), 'danger-icon', '✨ Synchronization complete! All Dev variables are active in Prod.', 'prod');
      break;
    case 'missing-dev':
      html = renderMissingList(getFilteredKeys(Array.from(parsedProd.unique.keys()).filter(k => !parsedDev.unique.has(k)), query), 'blue-icon', '✨ Clean environment! No stray production keys.', 'dev');
      break;
    case 'diff-values':
      html = renderValueMismatches(query);
      break;
    case 'dupes':
      html = renderDuplicates();
      break;
    case 'linter':
      html = renderLinterView();
      break;
  }

  detailContent.innerHTML = html;
}

function getFilteredKeys(keys, query) {
  if (!query) return keys;
  return keys.filter(k => k.toLowerCase().includes(query));
}

/**
 * Render Unified Master Diff Table
 */
function renderUnifiedDiff(query, filterType) {
  const devMap = parsedDev.unique;
  const prodMap = parsedProd.unique;
  const allKeys = Array.from(new Set([...devMap.keys(), ...prodMap.keys()])).sort();
  
  let filtered = allKeys.filter(key => {
    // 1. Search Query
    if (query && !key.toLowerCase().includes(query)) return false;
    
    // 2. Filter Dropdown
    const hasDev = devMap.has(key);
    const hasProd = prodMap.has(key);
    const devVal = devMap.get(key);
    const prodVal = prodMap.get(key);
    
    if (filterType === 'mismatch') {
      return hasDev && hasProd && devVal !== prodVal;
    }
    if (filterType === 'missing') {
      return !hasDev || !hasProd;
    }
    if (filterType === 'identical') {
      return hasDev && hasProd && devVal === prodVal;
    }
    return true;
  });

  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        No matching variables found for filters.
      </div>
    `;
  }

  return `
    <div class="unified-diff-table">
      <div class="grid-header">
        <div>Variable Name</div>
        <div>Development Value</div>
        <div>Production Value</div>
        <div style="text-align: right;">Status</div>
      </div>
      ${filtered.map(key => {
        const hasDev = devMap.has(key);
        const hasProd = prodMap.has(key);
        const devVal = hasDev ? devMap.get(key) : '';
        const prodVal = hasProd ? prodMap.get(key) : '';
        
        let statusBadge = '';
        if (hasDev && hasProd) {
          if (devVal === prodVal) {
            statusBadge = '<span class="status-badge badge-identical">Identical</span>';
          } else {
            statusBadge = '<span class="status-badge badge-mismatch">Mismatch</span>';
          }
        } else if (hasDev) {
          statusBadge = '<span class="status-badge badge-missing-prod">Missing Prod</span>';
        } else {
          statusBadge = '<span class="status-badge badge-missing-dev">Missing Dev</span>';
        }

        const devMasked = getMaskedString(key, devVal);
        const prodMasked = getMaskedString(key, prodVal);
        
        const isDevEyeOn = devMasked === devVal;
        const isProdEyeOn = prodMasked === prodVal;
        
        return `
          <div class="grid-row">
            <div class="grid-cell key-cell" title="${key}">
              <button class="quick-copy" onclick="copyToClipboard('${key}', 'Variable Key name copied!')" title="Copy Key Name">
                ${COPY_ICON}
              </button>
              ${key}
            </div>
            
            <div class="grid-cell">
              ${hasDev ? `
                <div class="value-container" title="${escapeHtml(devVal)}">
                  <span class="value-text">${escapeHtml(devMasked) || '<span class="empty-val">empty</span>'}</span>
                  ${showMasked && ["KEY", "PASS", "SECRET", "TOKEN", "AUTH", "DATABASE", "URL", "JWT", "SALT", "PWD"].some(w => key.includes(w)) ? `
                    <button class="reveal-btn" onclick="toggleReveal('${key}')">
                      ${manuallyUnmaskedKeys.has(key) ? EYE_OFF_ICON : EYE_ON_ICON}
                    </button>
                  ` : ''}
                  <button class="quick-copy" onclick="copyToClipboard('${escapeHtml(devVal)}', 'Dev value copied!')" title="Copy Dev Value">
                    ${COPY_ICON}
                  </button>
                </div>
              ` : `<span class="empty-val">-</span>`}
            </div>
            
            <div class="grid-cell">
              ${hasProd ? `
                <div class="value-container" title="${escapeHtml(prodVal)}">
                  <span class="value-text">${escapeHtml(prodMasked) || '<span class="empty-val">empty</span>'}</span>
                  ${showMasked && ["KEY", "PASS", "SECRET", "TOKEN", "AUTH", "DATABASE", "URL", "JWT", "SALT", "PWD"].some(w => key.includes(w)) ? `
                    <button class="reveal-btn" onclick="toggleReveal('${key}')">
                      ${manuallyUnmaskedKeys.has(key) ? EYE_OFF_ICON : EYE_ON_ICON}
                    </button>
                  ` : ''}
                  <button class="quick-copy" onclick="copyToClipboard('${escapeHtml(prodVal)}', 'Prod value copied!')" title="Copy Prod Value">
                    ${COPY_ICON}
                  </button>
                </div>
              ` : `<span class="empty-val">-</span>`}
            </div>
            
            <div class="grid-cell action-cell">
              ${statusBadge}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render Missing lists with Quick Action injects
 */
function renderMissingList(keys, iconClass, emptyMessage, destinationEnv) {
  if (keys.length === 0) {
    return `
      <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: var(--success-glow);">
        ${emptyMessage}
      </div>
    `;
  }

  return `
    <div class="missing-list">
      ${keys.map(key => `
        <div class="missing-item ${iconClass}">
          <div class="item-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <code>${key}</code>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="action-btn secondary-action" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="copyMissingToOpposite('${key}', '${destinationEnv}')">
              Sync
            </button>
            <button class="quick-copy" onclick="copyToClipboard('${key}', 'Key name copied!')" title="Copy Key">
              ${COPY_ICON}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render Value differences cards
 */
function renderValueMismatches(query) {
  const devMap = parsedDev.unique;
  const prodMap = parsedProd.unique;
  const mismatches = [];
  
  devMap.forEach((devVal, key) => {
    if (prodMap.has(key)) {
      const prodVal = prodMap.get(key);
      if (devVal !== prodVal) {
        if (!query || key.toLowerCase().includes(query)) {
          mismatches.push({ key, devVal, prodVal });
        }
      }
    }
  });

  if (mismatches.length === 0) {
    return `
      <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: var(--success-glow);">
        ✨ Complete Value Match! All shared variables are fully synchronized.
      </div>
    `;
  }

  return `
    <div class="diff-list">
      ${mismatches.map(item => {
        const devMasked = getMaskedString(item.key, item.devVal);
        const prodMasked = getMaskedString(item.key, item.prodVal);
        
        return `
          <div class="diff-item">
            <div class="diff-header">
              <div class="diff-header-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <span>${item.key}</span>
              </div>
              <div style="display: flex; gap: 0.35rem;">
                <button class="quick-copy" onclick="copyToClipboard('${item.key}', 'Key name copied!')" title="Copy Key">
                  ${COPY_ICON}
                </button>
              </div>
            </div>
            
            <div class="diff-values-grid">
              <div class="diff-col">
                <span class="diff-label">Development Value</span>
                <div class="diff-val">
                  <span>${escapeHtml(devMasked) || '<span class="empty-val">empty</span>'}</span>
                  <div style="display:flex; gap:0.25rem;">
                    ${showMasked && ["KEY", "PASS", "SECRET", "TOKEN", "AUTH", "DATABASE", "URL", "JWT", "SALT", "PWD"].some(w => item.key.includes(w)) ? `
                      <button class="reveal-btn" onclick="toggleReveal('${item.key}')">
                        ${manuallyUnmaskedKeys.has(item.key) ? EYE_OFF_ICON : EYE_ON_ICON}
                      </button>
                    ` : ''}
                    <button class="quick-copy" onclick="copyToClipboard('${escapeHtml(item.devVal)}', 'Dev value copied!')">
                      ${COPY_ICON}
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="diff-col">
                <span class="diff-label">Production Value</span>
                <div class="diff-val">
                  <span>${escapeHtml(prodMasked) || '<span class="empty-val">empty</span>'}</span>
                  <div style="display:flex; gap:0.25rem;">
                    ${showMasked && ["KEY", "PASS", "SECRET", "TOKEN", "AUTH", "DATABASE", "URL", "JWT", "SALT", "PWD"].some(w => item.key.includes(w)) ? `
                      <button class="reveal-btn" onclick="toggleReveal('${item.key}')">
                        ${manuallyUnmaskedKeys.has(item.key) ? EYE_OFF_ICON : EYE_ON_ICON}
                      </button>
                    ` : ''}
                    <button class="quick-copy" onclick="copyToClipboard('${escapeHtml(item.prodVal)}', 'Prod value copied!')">
                      ${COPY_ICON}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render duplicate keys checklist
 */
function renderDuplicates() {
  const devDupes = parsedDev.duplicates;
  const prodDupes = parsedProd.duplicates;
  const total = devDupes.length + prodDupes.length;

  if (total === 0) {
    return `
      <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: var(--success-glow);">
        ✨ No duplicated environment variables detected!
      </div>
    `;
  }

  let itemsHtml = '';

  devDupes.forEach(dupe => {
    itemsHtml += `
      <div class="missing-item yellow-icon">
        <div class="item-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <code>${dupe.key}</code>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Line ${dupe.lineNum} (Overrides previous declaration)</p>
        </div>
        <div style="display: flex; gap: 0.35rem; align-items:center;">
          <span class="dupe-tag">DEV</span>
          <button class="quick-copy" onclick="copyToClipboard('${dupe.key}', 'Key copied!')">
            ${COPY_ICON}
          </button>
        </div>
      </div>
    `;
  });

  prodDupes.forEach(dupe => {
    itemsHtml += `
      <div class="missing-item yellow-icon">
        <div class="item-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <code>${dupe.key}</code>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Line ${dupe.lineNum}</p>
        </div>
        <div style="display: flex; gap: 0.35rem; align-items:center;">
          <span class="dupe-tag" style="background: rgba(236,72,153,0.1); border-color: rgba(236,72,153,0.2); color: #ec4899;">PROD</span>
          <button class="quick-copy" onclick="copyToClipboard('${dupe.key}', 'Key copied!')">
            ${COPY_ICON}
          </button>
        </div>
      </div>
    `;
  });

  return `<div class="missing-list">${itemsHtml}</div>`;
}

/**
 * Render Security & Health Linter view
 */
function renderLinterView() {
  if (linterIssues.length === 0) {
    return `
      <div class="empty-state" style="border-color: var(--success-color); color: var(--success-color); border-style: solid; background: var(--success-glow);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success-color)">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Perfect Environment Health Score!</span>
        <p style="font-size: 0.8rem; color: var(--text-muted);">No security credentials leaks, weak values, formatting errors, or duplicates detected.</p>
      </div>
    `;
  }

  // Segment flat issues list into structural categories
  const categories = {
    exposedSecrets: { title: "Exposed Client-Side Secrets", issues: [], icon: ERROR_ICON, desc: "Critical vulnerabilities where credentials risk public exposure in javascript bundles." },
    criticalErrors: { title: "Critical Credentials & Network Health", issues: [], icon: WARNING_ICON, desc: "Database values, unsecure networks, or production integrity warnings." },
    codeQuality: { title: "Quality & Naming Standards", issues: [], icon: INFO_ICON, desc: "Upper casing syntax styles and duplication checks." }
  };

  linterIssues.forEach(issue => {
    if (categories[issue.category]) {
      categories[issue.category].issues.push(issue);
    }
  });

  return `
    <div class="linter-container">
      <div class="linter-summary">
        <div class="security-gauge" style="border-color: ${comparisonStats.securityScore >= 80 ? 'var(--success-color)' : comparisonStats.securityScore >= 50 ? 'var(--warning-color)' : 'var(--danger-color)'}">
          ${comparisonStats.securityScore}
        </div>
        <div class="linter-summary-text">
          <div class="linter-summary-title">Security & Configuration Health Index</div>
          <div class="linter-summary-desc">
            Detected ${linterIssues.length} issue${linterIssues.length !== 1 ? 's' : ''} with varying risk degrees. 
            Overall configuration is rated <strong>${comparisonStats.securityScore >= 85 ? 'Excellent' : comparisonStats.securityScore >= 60 ? 'Satisfactory' : 'Critical'}</strong>.
          </div>
        </div>
      </div>
      
      <div class="linter-groups">
        ${Object.keys(categories).map(catKey => {
          const group = categories[catKey];
          if (group.issues.length === 0) return '';
          
          return `
            <div class="linter-card">
              <div class="linter-card-header">
                ${group.icon}
                <span>${group.title}</span>
              </div>
              <div style="padding: 0.25rem 0;">
                ${group.issues.map(issue => `
                  <div class="linter-item-row">
                    <div class="linter-indicator text-${issue.severity}">
                      ${issue.severity === 'danger' ? ERROR_ICON : issue.severity === 'warning' ? WARNING_ICON : INFO_ICON}
                    </div>
                    <div class="linter-item-body">
                      <div class="linter-item-title">${issue.title}</div>
                      <div class="linter-item-desc">${issue.desc}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Interactions & Quick Buttons Logic
 */
window.copyToClipboard = function(text, successMsg) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMsg, 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'danger');
  });
};

window.toggleReveal = function(key) {
  if (manuallyUnmaskedKeys.has(key)) {
    manuallyUnmaskedKeys.delete(key);
  } else {
    manuallyUnmaskedKeys.add(key);
  }
  renderTab();
};

window.copyMissingToOpposite = function(key, destination) {
  if (destination === 'prod') {
    const val = parsedDev.unique.get(key) || '';
    const cleanComment = parsedDev.comments.has(key) ? '\n' + parsedDev.comments.get(key).join('\n') : '';
    prodInput.value = prodInput.value.trim() + `\n${cleanComment}\n${key}=${val}\n`;
    showToast(`Synced ${key} to Production!`, 'success');
  } else {
    const val = parsedProd.unique.get(key) || '';
    const cleanComment = parsedProd.comments.has(key) ? '\n' + parsedProd.comments.get(key).join('\n') : '';
    devInput.value = devInput.value.trim() + `\n${cleanComment}\n${key}=${val}\n`;
    showToast(`Synced ${key} to Development!`, 'success');
  }
  updateComparison();
};

// Global masking trigger
maskSecretsToggle.addEventListener('change', (e) => {
  showMasked = e.target.checked;
  manuallyUnmaskedKeys.clear();
  updateComparison();
  showToast(showMasked ? "Screen share mode enabled (Secrets masked)" : "Secrets visible", 'info');
});

// Clear all inputs
actionClearAll.addEventListener('click', () => {
  if (devInput.value.trim() === '' && prodInput.value.trim() === '') {
    showToast("Both inputs are already clear!", 'warning');
    return;
  }
  
  devInput.value = '';
  prodInput.value = '';
  devFileNameLabel.textContent = 'No file selected';
  prodFileNameLabel.textContent = 'No file selected';
  devFileInput.value = '';
  prodFileInput.value = '';
  
  // Clear active presets
  presetBtns.forEach(btn => btn.classList.remove('active'));
  
  updateComparison();
  showToast("All environment variables cleared!", 'info');
});

// Format and sort alphabetically
actionCleanSort.addEventListener('click', () => {
  if (devInput.value.trim() === '' && prodInput.value.trim() === '') {
    showToast("Nothing to format!", 'warning');
    return;
  }
  
  const cleanAndSortInput = (textarea, parsed) => {
    if (!textarea.value.trim()) return;
    
    const sortedKeys = Array.from(parsed.unique.keys()).sort();
    let result = '';
    
    sortedKeys.forEach(key => {
      // Add comments if they exist
      if (parsed.comments.has(key)) {
        result += parsed.comments.get(key).join('\n') + '\n';
      }
      result += `${key}=${parsed.unique.get(key)}\n\n`;
    });
    
    textarea.value = result.trim() + '\n';
  };
  
  cleanAndSortInput(devInput, parsedDev);
  cleanAndSortInput(prodInput, parsedProd);
  
  updateComparison();
  showToast("Alphabetized and cleaned duplicate variables!", 'success');
});

// Sync all missing keys mutually
actionSyncMissing.addEventListener('click', () => {
  const devMap = parsedDev.unique;
  const prodMap = parsedProd.unique;
  
  let syncDevCount = 0;
  let syncProdCount = 0;
  
  // Dev keys missing in Prod
  devMap.forEach((val, key) => {
    if (!prodMap.has(key)) {
      const comment = parsedDev.comments.has(key) ? '\n' + parsedDev.comments.get(key).join('\n') : '';
      prodInput.value = prodInput.value.trim() + `\n${comment}\n${key}=\n`;
      syncProdCount++;
    }
  });
  
  // Prod keys missing in Dev
  prodMap.forEach((val, key) => {
    if (!devMap.has(key)) {
      const comment = parsedProd.comments.has(key) ? '\n' + parsedProd.comments.get(key).join('\n') : '';
      devInput.value = devInput.value.trim() + `\n${comment}\n${key}=\n`;
      syncDevCount++;
    }
  });
  
  if (syncDevCount === 0 && syncProdCount === 0) {
    showToast("Environments are already in sync!", 'info');
    return;
  }
  
  updateComparison();
  showToast(`Synced! Added ${syncProdCount} keys to Prod and ${syncDevCount} keys to Dev.`, 'success');
});

// Download Merged file
actionDownloadMerged.addEventListener('click', () => {
  if (devInput.value.trim() === '' && prodInput.value.trim() === '') {
    showToast("Nothing to download!", 'warning');
    return;
  }
  
  const devMap = parsedDev.unique;
  const prodMap = parsedProd.unique;
  
  // Combine all keys
  const allKeys = Array.from(new Set([...devMap.keys(), ...prodMap.keys()])).sort();
  
  let mergedText = `# Unified Environment Configuration Template\n`;
  mergedText += `# Generated via EnvCompare on ${new Date().toLocaleDateString()}\n\n`;
  
  allKeys.forEach(key => {
    // Add comments from either dev or prod
    if (parsedDev.comments.has(key)) {
      mergedText += parsedDev.comments.get(key).join('\n') + '\n';
    } else if (parsedProd.comments.has(key)) {
      mergedText += parsedProd.comments.get(key).join('\n') + '\n';
    }
    
    // Prefer Dev values as base template values
    const value = devMap.has(key) ? devMap.get(key) : prodMap.get(key);
    mergedText += `${key}=${value}\n\n`;
  });
  
  // Create download trigger
  const blob = new Blob([mergedText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '.env.merged';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("Merged .env template download triggered!", 'success');
});

/**
 * File Loading & Drag & Drop Support
 */
function handleFileSelect(e, type) {
  const file = e.target.files[0];
  if (!file) return;
  readFileContent(file, type);
}

function readFileContent(file, type) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    if (type === 'dev') {
      devInput.value = text;
      devFileNameLabel.textContent = file.name;
    } else {
      prodInput.value = text;
      prodFileNameLabel.textContent = file.name;
    }
    updateComparison();
    showToast(`Loaded ${file.name} successfully!`, 'success');
  };
  reader.readAsText(file);
}

// Clear buttons setup
devClearBtn.addEventListener('click', () => {
  devInput.value = '';
  devFileNameLabel.textContent = 'No file selected';
  devFileInput.value = ''; // reset file element
  updateComparison();
  showToast("Development inputs cleared.", 'info');
});

prodClearBtn.addEventListener('click', () => {
  prodInput.value = '';
  prodFileNameLabel.textContent = 'No file selected';
  prodFileInput.value = ''; // reset file element
  updateComparison();
  showToast("Production inputs cleared.", 'info');
});

// Drag & Drop event bindings
function setupDragDrop(zone, input, type, label) {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });
  
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      readFileContent(file, type);
    }
  });
}

setupDragDrop(devDropZone, devInput, 'dev', devFileNameLabel);
setupDragDrop(prodDropZone, prodInput, 'prod', prodFileNameLabel);

devFileInput.addEventListener('change', (e) => handleFileSelect(e, 'dev'));
prodFileInput.addEventListener('change', (e) => handleFileSelect(e, 'prod'));

/**
 * Preset loader integrations
 */
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const name = btn.getAttribute('data-preset');
    if (DEMO_PRESETS[name]) {
      devInput.value = DEMO_PRESETS[name].dev;
      prodInput.value = DEMO_PRESETS[name].prod;
      
      // Update label displays
      devFileNameLabel.textContent = `${name}.dev.env`;
      prodFileNameLabel.textContent = `${name}.prod.env`;
      
      updateComparison();
      showToast(`Loaded ${btn.textContent} Demo Dataset!`, 'info');
    }
  });
});

/**
 * Tabs navigation & filters bindings
 */
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.getAttribute('data-tab');
    
    // Clear search bar on switch
    resultsSearch.value = '';
    diffFilter.value = 'all';
    
    renderTab();
  });
});

resultsSearch.addEventListener('input', renderTab);
diffFilter.addEventListener('change', renderTab);

// Live listening
devInput.addEventListener('input', () => {
  // Clear preset active tag on manual typing
  presetBtns.forEach(b => b.classList.remove('active'));
  devFileNameLabel.textContent = 'Manual Input';
  updateComparison();
});

prodInput.addEventListener('input', () => {
  // Clear preset active tag on manual typing
  presetBtns.forEach(b => b.classList.remove('active'));
  prodFileNameLabel.textContent = 'Manual Input';
  updateComparison();
});

// Initialize
initTheme();
updateComparison();
