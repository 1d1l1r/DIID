import { test, expect, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
const stash = { id: 'stash-1', name: 'Private stash', latitude: 43.24, longitude: 76.92, description: 'Private description', note: null,
  images: [{ id: 'img-1', file_name: 'private-photo.png' }] }
const profile = { id: 'person-1', last_name: 'Person', first_name: 'Test', middle_name: null, iin: null, phone: null, birth_date: null,
  address: 'Old registration', addresses_match: true, residential_address: null, note: null, tags: [] }

async function setup(page: Page, pin = true) {
  await page.addInitScript(({ pinHash, decoyPinHash }) => {
    localStorage.setItem('diid-lang', JSON.stringify({ state: { lang: 'ru' }, version: 0 }))
    if (pinHash) localStorage.setItem('diid-pin', JSON.stringify({ state: { pinHash, decoyPinHash }, version: 0 }))
    Object.defineProperty(navigator, 'geolocation', { value: {
      watchPosition(success: PositionCallback) {
        (window as unknown as { geoSuccess: PositionCallback }).geoSuccess = success
        setTimeout(() => success({ coords: { latitude: 43.238, longitude: 76.918, accuracy: 8 }, timestamp: Date.now() } as GeolocationPosition), 10)
        return 42
      },
      clearWatch(id: number) { (window as unknown as { clearedWatch: number }).clearedWatch = id },
    } })
  }, { pinHash: pin ? createHash('sha256').update('1234').digest('hex') : null, decoyPinHash: createHash('sha256').update('4321').digest('hex') })
  let saved = { ...profile }
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    if (path.includes('/images/')) return route.fulfill({ contentType: 'image/png', body: Buffer.from(png, 'base64') })
    let body: unknown = []
    if (path === '/auth/me') body = { id: 'user-1', username: 'admin', role: 'master' }
    else if (path === '/settings') body = { visibility: { preset: 'balanced', fields: {} } }
    else if (path === '/stashes/stash-1') body = stash
    else if (path === '/stashes') body = [stash]
    else if (path === '/profiles/person-1') {
      if (route.request().method() === 'PUT') saved = { ...saved, ...route.request().postDataJSON() }
      body = saved
    } else if (path === '/profiles') {
      if (route.request().method() === 'POST') { saved = { ...saved, ...route.request().postDataJSON() }; body = saved }
      else body = [saved]
    }
    await route.fulfill({ json: body })
  })
  // Tests never send vault coordinates or tile requests to external providers.
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from(png, 'base64') }))
}

async function enterPin(page: Page, pin = '1234') {
  for (const digit of pin) await page.getByRole('button', { name: digit, exact: true }).click()
}
async function openStash(page: Page, pin = true) {
  await setup(page, pin)
  await page.goto('/stashes/stash-1')
  if (pin) await enterPin(page)
  await expect(page.getByText('Private stash', { exact: true })).toBeVisible()
}
async function visibility(page: Page, hidden: boolean) {
  await page.evaluate(hidden => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: hidden })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: hidden ? 'hidden' : 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
}

for (const event of ['visibility', 'blur', 'pagehide', 'bfcache']) {
  test(`photo cannot cover PIN after ${event}`, async ({ page }) => {
    await openStash(page)
    await page.getByAltText('private-photo.png').click()
    await expect(page.locator('.yarl__portal')).toBeVisible()
    if (event === 'visibility') await visibility(page, true)
    else if (event === 'bfcache') await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
    else await page.evaluate(name => window.dispatchEvent(new Event(name)), event)
    await expect(page.locator('.yarl__portal')).toHaveCount(0)
    await expect(page.getByText('Private stash', { exact: true })).toHaveCount(0)
    if (event !== 'bfcache') await expect(page.locator('#privacy-shield')).toBeVisible()
    await visibility(page, false)
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible()
    await enterPin(page)
    await expect(page.getByText('Private stash', { exact: true })).toBeVisible()
    await expect(page.locator('.yarl__portal')).toHaveCount(0)
  })
}

test('decoy relocks and never mounts vault behind it', async ({ page }) => {
  await setup(page)
  await page.goto('/stashes/stash-1')
  await enterPin(page, '4321')
  await expect(page.getByText('Private stash', { exact: true })).toHaveCount(0)
  await visibility(page, true)
  await visibility(page, false)
  await enterPin(page)
  await expect(page.getByText('Private stash', { exact: true })).toBeVisible()
})

test('without a PIN conceal still removes photo, then returns without a PIN dead end', async ({ page }) => {
  await openStash(page, false)
  await page.getByAltText('private-photo.png').click()
  await visibility(page, true)
  await expect(page.locator('.yarl__portal')).toHaveCount(0)
  await visibility(page, false)
  await expect(page.getByText('Private stash', { exact: true })).toBeVisible()
})

const routeBody = { code: 'Ok', routes: [{ distance: 400, duration: 300,
  geometry: { coordinates: [[76.918, 43.238], [76.919, 43.239], [76.92, 43.24]] },
  legs: [{ steps: [{ name: 'Test street', distance: 400, maneuver: { type: 'depart', location: [76.918, 43.238] } }] }],
}] }

test('navigation is opt-in, uses walking server, switches mode and stops on lock', async ({ page }) => {
  let routes = 0
  let endpoint = ''
  await page.route('https://routing.openstreetmap.de/**', async r => { routes++; endpoint = r.request().url(); await r.fulfill({ json: routeBody }) })
  await openStash(page)
  expect(routes).toBe(0)
  await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
  await expect(page.getByText('Маршрут: 400 м')).toBeVisible()
  expect(endpoint).toContain('/routed-foot/route/v1/driving/76.918,43.238;76.92,43.24')
  await page.getByLabel('Способ передвижения').selectOption('car')
  await expect.poll(() => endpoint).toContain('/routed-car/')
  await visibility(page, true)
  await expect(page.locator('.leaflet-container')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { clearedWatch: number }).clearedWatch)).toBe(42)
  const before = routes
  await page.evaluate(() => (window as unknown as { geoSuccess: PositionCallback }).geoSuccess({ coords: { latitude: 44, longitude: 77, accuracy: 1 } } as GeolocationPosition))
  expect(routes).toBe(before)
})

test('no route reports a recoverable error', async ({ page }) => {
  await page.route('https://routing.openstreetmap.de/**', r => r.fulfill({ json: { code: 'NoRoute' } }))
  await openStash(page)
  await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Маршрут не найден')
  await expect(page.getByRole('button', { name: 'Перестроить' })).toBeEnabled()
})

test('location denial does not send routing requests', async ({ page }) => {
  await openStash(page)
  await page.evaluate(() => { navigator.geolocation.watchPosition = (_success, error) => { setTimeout(() => error?.({ code: 1 } as GeolocationPositionError), 0); return 10 } })
  await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Нет доступа к геолокации')
})

test('profile create defaults to one address and supports separate residence', async ({ page }) => {
  await setup(page, false)
  await page.goto('/profiles')
  await page.getByRole('button', { name: 'Добавить', exact: true }).click()
  await expect(page.getByLabel('Фактический адрес совпадает с пропиской')).toBeChecked()
  await expect(page.getByLabel('Фактический адрес проживания', { exact: true })).toHaveCount(0)
  await page.getByPlaceholder('Фамилия *', { exact: true }).fill('Тест')
  await page.getByPlaceholder('Имя *', { exact: true }).fill('Иван')
  await page.getByLabel('Адрес прописки', { exact: true }).fill('Прописка')
  await page.getByLabel('Фактический адрес совпадает с пропиской').uncheck()
  await page.getByLabel('Фактический адрес проживания', { exact: true }).fill('Проживание')
  const request = page.waitForRequest(r => r.method() === 'POST' && r.url().endsWith('/profiles'))
  await page.getByRole('button', { name: 'Добавить', exact: true }).click()
  expect((await request).postDataJSON()).toMatchObject({ address: 'Прописка', addresses_match: false, residential_address: 'Проживание' })
})

test('profile edit preserves old address and saves checkbox changes', async ({ page }) => {
  await setup(page, false)
  await page.goto('/profiles/person-1')
  await expect(page.getByText('Адрес прописки: Old registration')).toBeVisible()
  await page.locator('button').filter({ has: page.locator('svg.lucide-pencil') }).click()
  await expect(page.getByLabel('Адрес прописки', { exact: true })).toHaveValue('Old registration')
  await page.getByLabel('Фактический адрес совпадает с пропиской').uncheck()
  await page.getByLabel('Фактический адрес проживания', { exact: true }).fill('Actual home')
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
  await expect(page.getByText('Фактический адрес проживания: Actual home')).toBeVisible()
})

test('file selection survives background lock and uploads to the original stash', async ({ page }) => {
  await openStash(page)
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Добавить', exact: true }).click()
  const chooser = await chooserPromise
  await visibility(page, true)
  await expect(page.getByText('Private stash', { exact: true })).toHaveCount(0)
  const upload = page.waitForRequest(r => r.method() === 'POST' && r.url().endsWith('/stashes/stash-1/images'))
  await chooser.setFiles({ name: 'new.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
  await upload
  await expect(page.locator('[data-vault-picker]')).toHaveCount(0)
  await visibility(page, false)
  await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible()
})

test('a PIN hash completed after backgrounding cannot unlock the vault', async ({ page }) => {
  await setup(page)
  await page.goto('/stashes/stash-1')
  await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible()
  // Delay WebCrypto's result, as can happen when iOS suspends a task.
  await page.evaluate(() => {
    const original = crypto.subtle.digest.bind(crypto.subtle)
    crypto.subtle.digest = (algorithm, data) => new Promise(resolve => {
      (window as unknown as { finishHash: () => void }).finishHash = () => { void original(algorithm, data).then(resolve) }
    })
  })
  for (const digit of '1234') await page.getByRole('button', { name: digit, exact: true }).click()
  await visibility(page, true)
  await visibility(page, false)
  await page.evaluate(() => (window as unknown as { finishHash: () => void }).finishHash())
  await expect(page.getByText('Неверный PIN')).toBeVisible()
  await expect(page.getByText('Private stash', { exact: true })).toHaveCount(0)
})
