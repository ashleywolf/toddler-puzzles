const { test, expect } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function fixtureServer(options = {}) {
  let revision = 1;
  const server = http.createServer((request, response) => {
    const filename = new URL(request.url, 'http://localhost').pathname.split('/').pop() || 'index.html';
    if (!['index.html', 'sw.js', 'manifest.webmanifest', 'icon.svg'].includes(filename)) {
      response.writeHead(404); response.end(); return;
    }
    if (options.failCache && filename === 'icon.svg') {
      response.writeHead(503); response.end('Intentionally unavailable fixture'); return;
    }
    let body = fs.readFileSync(path.join(__dirname, '..', filename));
    if (filename === 'sw.js') body = body.toString().replace('shell:v1', `shell:test-${revision}`);
    response.setHeader('Content-Type', filename.endsWith('.js') ? 'text/javascript' : filename.endsWith('.svg') ? 'image/svg+xml' : filename.endsWith('.html') ? 'text/html' : 'application/manifest+json');
    response.end(body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/toddler-puzzles/`,
    update: () => { revision++; },
    close: () => new Promise((resolve, reject) => {
      if (!server.listening) { resolve(); return; }
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    })
  };
}

async function start(page, url = './') {
  await page.goto(url);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
}
async function settings(page) {
  await page.getByRole('button', { name: 'Grown-ups', exact: true }).click();
  await page.getByRole('button', { name: 'Open garden settings' }).click();
}
async function choose(page, family, count = 2) {
  await settings(page);
  await page.getByLabel('Toy on the workbench').selectOption(family);
  await page.getByLabel('Pieces').selectOption(String(count));
  await page.getByRole('button', { name: 'Back to the garden' }).click();
}
async function build(page, family, count = 2) {
  await choose(page, family, count);
  for (let i = 0; i < count; i++) {
    await page.locator(`[data-source="part:${i}"]`).click();
    await page.locator(`[data-slot="${i}"]`).click();
  }
  await expect(page.locator(`[data-source="toy:${family}"]`)).toBeVisible();
}
async function move(page, source, destination) {
  await page.locator(`[data-source="${source}"]`).click();
  await page.locator(`[data-dest="${destination}"]`).click();
}

test('make, play, transport, remix, and restore the same world', async ({ page }, info) => {
  await start(page);
  await build(page, 'can');
  await page.screenshot({ path: info.outputPath('01-make.png'), fullPage: true });
  await move(page, 'toy:can', 'seedbed');
  await expect(page.locator('[data-source="flower"]')).toBeVisible();
  await build(page, 'boat');
  await move(page, 'flower', 'carrier:boat');
  await move(page, 'toy:boat', 'pond-right');
  await expect(page.locator('[data-source="toy:boat"]')).toHaveAttribute('data-position', 'pond-right');
  await page.screenshot({ path: info.outputPath('02-play.png'), fullPage: true });
  await build(page, 'wagon');
  await move(page, 'flower', 'carrier:wagon');
  await move(page, 'toy:wagon', 'rest-right');
  await page.getByRole('button', { name: 'Preview a new look' }).click();
  await page.getByRole('button', { name: 'Use this look' }).click();
  await expect(page.locator('[data-source="toy:wagon"]')).toHaveAttribute('data-look', '1');
  await page.screenshot({ path: info.outputPath('03-remix.png'), fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await choose(page, 'wagon');
  await expect(page.locator('[data-source="toy:wagon"]')).toHaveAttribute('data-look', '1');
  await expect(page.locator('[data-source="flower"]')).toHaveAttribute('data-owner', 'wagon');
  await expect(page.locator('[data-source="flower"]')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('04-restored.png'), fullPage: true });
});

for (const family of ['can', 'boat', 'wagon']) {
  for (const count of [2, 3, 4]) {
    test(`${family}: ${count} pieces, reversible remix and independent use`, async ({ page }) => {
      await start(page);
      await build(page, family, count);
      await page.getByRole('button', { name: 'Preview a new look' }).click();
      await page.getByRole('button', { name: 'Use this look' }).click();
      await expect(page.locator(`[data-source="toy:${family}"]`)).toHaveAttribute('data-look', '1');
      await page.getByRole('button', { name: 'Preview a new look' }).click();
      await page.getByRole('button', { name: 'Use this look' }).click();
      await expect(page.locator(`[data-source="toy:${family}"]`)).toHaveAttribute('data-look', '0');
    });
  }
}

test('wrong placements and board changes preserve unfinished variants', async ({ page }) => {
  await start(page);
  await page.locator('[data-source="part:0"]').click();
  await page.locator('[data-slot="1"]').click();
  await expect(page.locator('[data-slot="1"]')).toHaveAttribute('data-filled', 'false');
  await page.locator('[data-slot="0"]').click();
  await choose(page, 'boat', 4);
  await choose(page, 'can', 2);
  await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-filled', 'true');
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-filled', 'true');
});

test('keyboard placement works without dragging', async ({ page }) => {
  await start(page);
  await page.locator('[data-source="part:0"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('[data-slot="0"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-filled', 'true');
});

test('pointer dragging, outside releases, cancellation and secondary pointers', async ({ page }) => {
  await start(page);
  const part = page.locator('[data-source="part:0"]');
  const slot = page.locator('[data-slot="0"]');
  const from = await part.boundingBox();
  const to = await slot.boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(2, 2, { steps: 5 });
  await page.mouse.up();
  await expect(slot).toHaveAttribute('data-filled', 'false');
  await part.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'touch', clientX: from.x + 40, clientY: from.y + 40 });
  await part.dispatchEvent('pointerdown', { pointerId: 12, pointerType: 'touch', clientX: from.x + 40, clientY: from.y + 40 });
  await part.dispatchEvent('pointercancel', { pointerId: 11 });
  await expect(slot).toHaveAttribute('data-filled', 'false');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-filled', 'true');
});

test('touch-pointer drag places a piece once and cancels cleanly on resize', async ({ page }) => {
  await start(page);
  const part = page.locator('[data-source="part:0"]');
  const slot = page.locator('[data-slot="0"]');
  const from = await part.boundingBox(), to = await slot.boundingBox();
  const origin = { pointerId: 7, pointerType: 'touch', clientX: from.x + from.width / 2, clientY: from.y + from.height / 2 };
  const target = { pointerId: 7, pointerType: 'touch', clientX: to.x + to.width / 2, clientY: to.y + to.height / 2 };
  await part.dispatchEvent('pointerdown', origin);
  await part.dispatchEvent('pointermove', target);
  await expect(page.locator('#ghost')).toBeVisible();
  await part.dispatchEvent('pointerup', target);
  await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-filled', 'true');
  await expect(page.locator('#ghost')).toBeHidden();
  const next = page.locator('[data-source="part:1"]');
  await next.dispatchEvent('pointerdown', { ...origin, pointerId: 8 });
  await next.dispatchEvent('pointermove', { ...target, pointerId: 8 });
  await page.setViewportSize({ width: 700, height: 900 });
  await expect(page.locator('#ghost')).toBeHidden();
  await expect(page.locator('[data-slot="1"]')).toHaveAttribute('data-filled', 'false');
});

test('reset is confirmed and does not clear other origin data', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    localStorage.setItem('another-game', 'keep');
    await caches.open('another-game');
  });
  await build(page, 'can');
  await settings(page);
  await page.getByRole('button', { name: 'Reset this garden' }).click();
  await page.getByRole('button', { name: 'Keep my garden' }).click();
  await page.getByRole('button', { name: 'Reset this garden' }).click();
  await page.getByRole('button', { name: 'Yes, start a fresh garden' }).click();
  await page.getByRole('button', { name: 'Back to the garden' }).click();
  await expect(page.locator('[data-source="toy:can"]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('another-game'))).toBe('keep');
  expect(await page.evaluate(() => caches.has('another-game'))).toBe(true);
});

test('invalid or unavailable storage is reported, not silently restored', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('make-play-remix:world:v1', '{"version":99}'));
  await start(page);
  await settings(page);
  await expect(page.locator('#save-status')).toContainText('could not');
});

test('offline reload supports the complete connected loop with the origin shut down', async ({ page }) => {
  const origin = await fixtureServer();
  try {
    await start(page, origin.url);
    await settings(page);
    await expect(page.locator('#offline-status')).toHaveText('Ready offline', { timeout: 20000 });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.getByRole('button', { name: 'Back to the garden' }).click();
    await origin.close();
    await page.reload();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await build(page, 'can');
    await move(page, 'toy:can', 'seedbed');
    await build(page, 'boat');
    await move(page, 'flower', 'carrier:boat');
    await expect(page.locator('[data-source="flower"]')).toHaveAttribute('data-owner', 'boat');
  } finally { await origin.close(); }
});

test('failed shell caching never reports offline readiness', async ({ page }) => {
  const origin = await fixtureServer({ failCache: true });
  try {
    await start(page, origin.url);
    await settings(page);
    await expect(page.locator('#offline-status')).toContainText('unavailable', { timeout: 20000 });
  } finally { await origin.close(); }
});

test('an update waits for approval and keeps unfinished creations and unrelated caches', async ({ page }) => {
  const origin = await fixtureServer();
  try {
    await start(page, origin.url);
    await settings(page);
    await expect(page.locator('#offline-status')).toHaveText('Ready offline', { timeout: 20000 });
    await page.getByRole('button', { name: 'Back to the garden' }).click();
    await page.locator('[data-source="part:0"]').click();
    await page.locator('[data-slot="0"]').click();
    await page.evaluate(async () => {
      localStorage.setItem('neighbor', 'keep');
      await caches.open('neighbor');
    });
    origin.update();
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
    await settings(page);
    await expect(page.getByRole('button', { name: 'Save and update the game' })).toBeVisible();
    await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-filled', 'true');
    await page.getByRole('button', { name: 'Save and update the game' }).click();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-filled', 'true');
    expect(await page.evaluate(() => localStorage.getItem('neighbor'))).toBe('keep');
    expect(await page.evaluate(() => caches.has('neighbor'))).toBe(true);
  } finally { await origin.close(); }
});

test('unavailable saves show an explicit status without blocking construction', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  await start(page);
  await build(page, 'can');
  await settings(page);
  await expect(page.locator('#save-status')).toContainText('could not be saved');
});

test('complete construction without a matching toy is rejected during restore', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('make-play-remix:world:v1', JSON.stringify({
      version: 1,
      builds: { can: { 2: [0, 1], 3: [], 4: [] }, boat: { 2: [], 3: [], 4: [] }, wagon: { 2: [], 3: [], 4: [] } },
      toys: {}, flower: null
    }));
  });
  await start(page);
  await settings(page);
  await expect(page.locator('#save-status')).toContainText('could not be restored');
});

test('sound starts off and audio failure leaves visual play usable', async ({ page }) => {
  await page.addInitScript(() => { window.AudioContext = undefined; window.webkitAudioContext = undefined; });
  await start(page);
  await settings(page);
  await expect(page.getByRole('button', { name: 'Enable gentle sounds' })).toBeVisible();
  await page.getByRole('button', { name: 'Enable gentle sounds' }).click();
  await expect(page.locator('#audio-status')).toContainText('unavailable');
  await page.getByRole('button', { name: 'Back to the garden' }).click();
  await build(page, 'can');
});

test('all sound can be muted and every new visit starts silently', async ({ page }) => {
  await start(page);
  await settings(page);
  await page.getByRole('button', { name: 'Enable gentle sounds' }).click();
  await expect(page.getByRole('button', { name: 'Mute all sounds' })).toBeVisible();
  expect(await page.evaluate(() => audio.state)).toBe('running');
  await page.getByRole('button', { name: 'Mute all sounds' }).click();
  await expect(page.getByRole('button', { name: 'Enable gentle sounds' })).toBeVisible();
  expect(await page.evaluate(() => audio.state)).toBe('suspended');
  await page.reload();
  await settings(page);
  await expect(page.getByRole('button', { name: 'Enable gentle sounds' })).toBeVisible();
});

test('dark theme, reduced motion, and zoom preserve readable interaction', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await start(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.locator('[data-source="part:0"]').click();
  await page.locator('[data-slot="0"]').click();
  expect(await page.locator('#zones').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.keyboard.press('Tab');
  await page.locator('[data-source="part:1"]').focus();
  expect(await page.locator('[data-source="part:1"]').evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('responsive targets remain large and no external requests or console errors', async ({ page }) => {
  const errors = [];
  const external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4178/')) external.push(request.url()); });
  await start(page);
  for (const [width, height] of [[320,568],[568,320],[390,844],[768,1024],[1024,768]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const target of await page.locator('[data-source], [data-slot], [data-dest]').all()) {
      const box = await target.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(80);
      expect(box.height).toBeGreaterThanOrEqual(80);
    }
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the downloaded HTML plays on a desktop without a server', async ({ page }) => {
  await start(page, pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
  for (let i = 0; i < 2; i++) {
    await page.locator(`[data-source="part:${i}"]`).click();
    await page.locator(`[data-slot="${i}"]`).click();
  }
  await move(page, 'toy:can', 'seedbed');
  await expect(page.locator('[data-source="flower"]')).toBeVisible();
  await settings(page);
  await expect(page.locator('#offline-status')).toContainText('downloaded HTML');
});
