const { chromium } = require('C:/Users/hephz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const login = await context.request.post('http://127.0.0.1:4176/api/auth/executive-login', { data: { username: 'superadmin', password: 'EagleSuperAdmin2025!' } });
    assert.equal(login.status(), 200);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', async response => {
      if (response.url().includes('/staff/management') && response.request().method() !== 'GET') console.log('Save response:', response.status(), await response.text());
    });
    await page.goto('http://127.0.0.1:4176/executive-console/?tab=staff');
    await page.getByRole('heading', { name: 'Staff & human resources' }).waitFor();
    await page.getByRole('button', { name: 'Edit record', exact: true }).first().waitFor();
    const output = path.resolve('outputs/hr-dashboard-verification');
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'staff-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Edit record', exact: true }).first().click();
    const name = page.getByLabel('Full name');
    const previous = await name.inputValue();
    await name.fill(previous + ' Preview');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.waitForTimeout(1000);
    console.log('Editor alerts:', await page.getByRole('alert').allTextContents());
    await page.screenshot({ path: path.join(output, 'save-result.png'), fullPage: true });
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.reload();
    await page.getByRole('button', { name: previous + ' Preview', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Portal access', exact: true }).first().click();
    await page.getByLabel('Portal username', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'portal-access.png'), fullPage: true });
    await page.getByRole('button', { name: 'Close staff editor' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'staff-mobile.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'Page overflows on mobile');
    await page.goto('http://127.0.0.1:4176/executive-console/?tab=students');
    const filter = page.getByLabel('Filter students by class');
    await filter.waitFor();
    const options = await filter.locator('option').evaluateAll(nodes => nodes.map(n => ({ value: n.value, name: n.textContent })));
    const primary4 = options.find(o => o.name.startsWith('Primary 4 '));
    assert.ok(primary4);
    const responsePromise = page.waitForResponse(r => r.url().includes('/api/students?') && r.url().includes(`class_id=${primary4.value}`));
    await filter.selectOption(primary4.value);
    const data = await (await responsePromise).json();
    assert.equal(data.total, 17);
    assert.ok(data.data.every(s => String(s.class_id) === primary4.value));
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: staff editing persists after reload, access editor works, mobile fits, Primary 4 filter returns 17 correct students.');
    console.log('Screenshots saved to outputs/hr-dashboard-verification');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
