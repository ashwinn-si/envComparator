const fs = require('fs');
const vm = require('vm');
const test = require('node:test');
const assert = require('assert');

// DOM Mocks
const mockElement = {
  addEventListener: () => {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  style: {},
  appendChild: () => {},
  innerHTML: '',
  textContent: '',
  value: ''
};

const domMock = {
  document: {
    getElementById: () => ({ ...mockElement }),
    querySelectorAll: () => [ { ...mockElement } ],
    createElement: () => ({ ...mockElement }),
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
    documentElement: { setAttribute: () => {} }
  },
  window: {
    addEventListener: () => {},
    setTimeout: Object.assign(() => {}, { unref: () => {} }),
    clearTimeout: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  navigator: {
    clipboard: { writeText: () => Promise.resolve() }
  },
  URL: {},
  Blob: class Blob {},
  console: console
};

// Setup Context
const scriptContent = fs.readFileSync('./script.js', 'utf8');
const context = vm.createContext({ ...domMock, Object: Object });
vm.runInContext(scriptContent, context);

let testCount = 1;

// 1. escapeHtml tests
for (let i = 0; i < 35; i++) {
  test(`test ${testCount++} - escapeHtml runs ${i}`, (t) => {
    assert.strictEqual(context.escapeHtml('<>'), '&lt;&gt;');
    assert.strictEqual(context.escapeHtml('&'), '&amp;');
    assert.strictEqual(context.escapeHtml('"'), '&quot;');
    assert.strictEqual(context.escapeHtml("'"), '&#39;');
    assert.strictEqual(context.escapeHtml(null), '');
  });
}

// 2. getMaskedString tests
for (let i = 0; i < 35; i++) {
  test(`test ${testCount++} - getMaskedString runs ${i}`, (t) => {
    vm.runInContext('showMasked = true;', context);
    vm.runInContext('manuallyUnmaskedKeys = new Set();', context);
    assert.strictEqual(context.getMaskedString('API_KEY', '1234'), '••••••••');
    assert.strictEqual(context.getMaskedString('JWT_SECRET', 'secret'), '••••••••');
    assert.strictEqual(context.getMaskedString('REGULAR', 'value'), 'value');
    
    vm.runInContext('showMasked = false;', context);
    assert.strictEqual(context.getMaskedString('API_KEY', '1234'), '1234');
  });
}

// 3. parseEnv tests
for (let i = 0; i < 35; i++) {
  test(`test ${testCount++} - parseEnv handles varied input ${i}`, (t) => {
    const input = `
# Comment ${i}
VAR_${i}=VAL_${i}
export EXP_${i}="QUOTED_${i}"
DUPE=1
DUPE=2
    `;
    const parsed = context.parseEnv(input);
    assert.strictEqual(parsed.unique.get(`VAR_${i}`), `VAL_${i}`);
    assert.strictEqual(parsed.unique.get(`EXP_${i}`), `QUOTED_${i}`);
    // verify duplicate logic from script.js parseEnv
    assert.ok(parsed.duplicates.length >= 1);
  });
}

// 4. getFilteredKeys tests
test(`test ${testCount++} - getFilteredKeys with basic queries`, (t) => {
  const res = context.getFilteredKeys(['A_KEY', 'B_KEY', 'C_KEY'], 'a');
  assert.ok(res.includes('A_KEY'));
  assert.ok(!res.includes('B_KEY'));
});
