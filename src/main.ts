import { initScene, loadVRM } from './scene'
import { setupCamera, stopCamera } from './camera'
import { initFaceTracker, detectFace } from './face-tracker'
import { applyFaceToVRM } from './landmark-mapper'

const inputVideo    = document.getElementById('input-video')    as HTMLVideoElement
const previewVideo  = document.getElementById('preview-video')  as HTMLVideoElement
const canvas        = document.getElementById('three-canvas')   as HTMLCanvasElement
const cameraStartBtn = document.getElementById('camera-start')  as HTMLButtonElement
const cameraStopBtn  = document.getElementById('camera-stop')   as HTMLButtonElement
const vrmInput      = document.getElementById('vrm-input')      as HTMLInputElement
const loadingOverlay = document.getElementById('loading-overlay') as HTMLDivElement
const loadingText   = document.getElementById('loading-text')   as HTMLParagraphElement
const statusText    = document.getElementById('status-text')    as HTMLParagraphElement

const barBlinkLeft  = document.getElementById('bar-blink-left')  as HTMLDivElement
const barBlinkRight = document.getElementById('bar-blink-right') as HTMLDivElement
const barMouth      = document.getElementById('bar-mouth')       as HTMLDivElement
const valBlinkLeft  = document.getElementById('val-blink-left')  as HTMLSpanElement
const valBlinkRight = document.getElementById('val-blink-right') as HTMLSpanElement
const valMouth      = document.getElementById('val-mouth')       as HTMLSpanElement

interface Globals {
  _ma_blinkL?: number
  _ma_blinkR?: number
  _ma_mouth?:  number
}

let cameraRunning = false

function setStatus(msg: string): void {
  statusText.textContent = msg
}

function setLoading(msg: string | null): void {
  if (msg === null) {
    loadingOverlay.style.display = 'none'
    return
  }
  loadingOverlay.style.display = 'flex'
  loadingText.textContent = msg
}

function updateStatsUI(): void {
  const g = window as unknown as Globals
  const blinkL = Math.round((g._ma_blinkL ?? 0) * 100)
  const blinkR = Math.round((g._ma_blinkR ?? 0) * 100)
  const mouth  = Math.round((g._ma_mouth  ?? 0) * 100)

  barBlinkLeft.style.width  = `${blinkL}%`
  barBlinkRight.style.width = `${blinkR}%`
  barMouth.style.width      = `${mouth}%`
  valBlinkLeft.textContent  = `${blinkL}%`
  valBlinkRight.textContent = `${blinkR}%`
  valMouth.textContent      = `${mouth}%`
}

async function main(): Promise<void> {
  // 3D シーン初期化
  const sceneCtx = initScene(canvas)

  // MediaPipe 初期化
  setLoading('MediaPipe 初期化中…')
  setStatus('MediaPipe 初期化中…')
  await initFaceTracker()

  // デフォルト VRM 読み込み
  setLoading('VRM 読み込み中…')
  setStatus('VRM 読み込み中…')
  const defaultVrmUrl = new URL('../public/models/AvatarSample_A.vrm', import.meta.url).href
  try {
    await loadVRM(defaultVrmUrl, sceneCtx)
    setLoading(null)
    setStatus('カメラ未起動')
  } catch (e) {
    setLoading('VRM の読み込みに失敗しました')
    setStatus('VRM 読み込みエラー')
    console.error(e)
  }

  // 顔検出ループ（毎フレーム）
  function detectLoop(): void {
    if (cameraRunning && sceneCtx.vrm && inputVideo.readyState >= 2) {
      const result = detectFace(inputVideo, performance.now())
      if (result) {
        applyFaceToVRM(result, sceneCtx.vrm)
        updateStatsUI()
      }
    }
    requestAnimationFrame(detectLoop)
  }
  detectLoop()

  // カメラ開始
  cameraStartBtn.addEventListener('click', async () => {
    try {
      setStatus('カメラ接続中…')
      await setupCamera(inputVideo, previewVideo)
      cameraRunning = true
      cameraStartBtn.classList.add('hidden')
      cameraStopBtn.classList.remove('hidden')
      setStatus('トラッキング中')
    } catch (e) {
      setStatus('カメラの起動に失敗しました')
      console.error(e)
    }
  })

  // カメラ停止
  cameraStopBtn.addEventListener('click', () => {
    stopCamera(inputVideo, previewVideo)
    cameraRunning = false
    cameraStopBtn.classList.add('hidden')
    cameraStartBtn.classList.remove('hidden')
    setStatus('カメラ停止中')
  })

  // VRM ファイル読み込み
  vrmInput.addEventListener('change', async () => {
    const file = vrmInput.files?.[0]
    if (!file) return
    setStatus(`VRM 読み込み中: ${file.name}`)
    const url = URL.createObjectURL(file)
    try {
      await loadVRM(url, sceneCtx)
      setStatus(`読み込み完了: ${file.name}`)
    } catch (e) {
      setStatus('VRM 読み込みに失敗しました')
      console.error(e)
    } finally {
      URL.revokeObjectURL(url)
    }
  })
}

main().catch(err => {
  console.error(err)
  setStatus?.('初期化に失敗しました')
})
