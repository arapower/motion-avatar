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
})
