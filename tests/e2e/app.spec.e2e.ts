import { test, expect } from '@playwright/test'

test.describe('motion-avatar 基本 UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('タイトルが motion-avatar である', async ({ page }) => {
    await expect(page).toHaveTitle('motion-avatar')
  })

  test('カメラ開始ボタンが表示されている', async ({ page }) => {
    const btn = page.locator('#camera-start')
    await expect(btn).toBeVisible()
    await expect(btn).toHaveText('カメラ開始')
  })

  test('VRM を読み込むラベルが表示されている', async ({ page }) => {
    const label = page.locator('#vrm-label')
    await expect(label).toBeVisible()
  })

  test('Three.js canvas が DOM に存在する', async ({ page }) => {
    await expect(page.locator('#three-canvas')).toBeAttached()
  })

  test('カメラ停止ボタンは初期状態で非表示', async ({ page }) => {
    await expect(page.locator('#camera-stop')).toBeHidden()
  })

  test('右パネルのリアルタイム値バーが存在する', async ({ page }) => {
    await expect(page.locator('#bar-blink-left')).toBeAttached()
    await expect(page.locator('#bar-blink-right')).toBeAttached()
    await expect(page.locator('#bar-mouth')).toBeAttached()
  })

  test('キャプチャー範囲ボタンが 3 つ存在する', async ({ page }) => {
    const btns = page.locator('.range-btn')
    await expect(btns).toHaveCount(3)
  })

  test('初期状態では「顔のみ」ボタンがアクティブ', async ({ page }) => {
    const faceBtn = page.locator('#range-face')
    await expect(faceBtn).toHaveClass(/active-range/)
  })

  test('「上半身」ボタンをクリックするとアクティブになる', async ({ page }) => {
    await page.locator('#range-upper-body').click()
    await expect(page.locator('#range-upper-body')).toHaveClass(/active-range/)
    await expect(page.locator('#range-face')).not.toHaveClass(/active-range/)
  })

  test('「全身」ボタンをクリックするとアクティブになる', async ({ page }) => {
    await page.locator('#range-full-body').click()
    await expect(page.locator('#range-full-body')).toHaveClass(/active-range/)
  })
})
