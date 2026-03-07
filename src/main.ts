import { initScene, loadVRM, type CaptureRange } from './scene'
import { setupCamera, stopCamera } from './camera'
import { initFaceTracker, detectFace } from './face-tracker'
import { initPoseTracker, detectPose } from './pose-tracker'
import { applyFaceToVRM } from './landmark-mapper'
import { applyUpperBodyToVRM, applyLowerBodyToVRM } from './pose-mapper'

// DOM refs
const inputVideo      = document.getElementById('input-video')      as HTMLVideoElement
const previewVideo    = document.getElementById('preview-video')    as HTMLVideoElement
const canvas          = document.getElementById('three-canvas')     as HTMLCanvasElement
const cameraStartBtn  = document.getElementById('camera-start')     as HTMLButtonElement
const cameraStopBtn   = document.getElementById('camera-stop')      as HTMLButtonElement
const vrmInput        = document.getElementById('vrm-input')        as HTMLInputElement
const loadingOverlay  = document.getElementById('loading-overlay')  as HTMLDivElement
const loadingText     = document.getElementById('loading-text')     as HTMLParagraphElement
const statusText      = document.getElementById('status-text')      as HTMLParagraphElement

const barBlinkLeft    = document.getElementById('bar-blink-left')   as HTMLDivElement
const barBlinkRight   = document.getElementById('bar-blink-right')  as HTMLDivElement
const barMouth        = document.getElementById('bar-mouth')        as HTMLDivElement
const valBlinkLeft    = document.getElementById('val-blink-left')   as HTMLSpanElement
const valBlinkRight   = document.getElementById('val-blink-right')  as HTMLSpanElement
const valMouth        = document.getElementById('val-mouth')        as HTMLSpanElement

const rangeBtns = document.querySelectorAll<HTMLButtonElement>('.range-btn')

interface Globals {
  _ma_blinkL?: number
  _ma_blinkR?: number
  _ma_mouth?:  number
}

let cameraRunning    = false
let captureRange: CaptureRange = 'face'
let poseTrackerReady = false

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

function updateRangeBtns(range: CaptureRange): void {
  rangeBtns.forEach(btn => {
    if (btn.dataset['range'] === range) {
      btn.classList.add('active-range')
    } else {
      btn.classList.remove('active-range')
    }
  })
}

async function main(): Promise<void> {
  const sceneCtx = initScene(canvas)

  // Face tracker 初期化
  setLoading('MediaPipe FaceLandmarker 初期化中…')
  setStatus('FaceLandmarker 初期化中…')
  await initFaceTracker()

  // Pose tracker は遅延初期化（上半身/全身が選択されたときに実行）
  async function ensurePoseTracker(): Promise<void> {
    if (poseTrackerReady) return
    setStatus('PoseLandmarker 初期化中…')
    await initPoseTracker()
    poseTrackerReady = true
  }

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

  // --- キャプチャー範囲ボタン ---
  rangeBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const range = btn.dataset['range'] as CaptureRange
      captureRange = range
      updateRangeBtns(range)
      sceneCtx.setCaptureRange(range)
      if (range !== 'face') {
        await ensurePoseTracker()
        if (cameraRunning) setStatus('トラッキング中')
      }
    })
  })

  // --- 顔・体 検出ループ ---
  function detectLoop(): void {
    if (cameraRunning && sceneCtx.vrm && inputVideo.readyState >= 2) {
      const ts = performance.now()

      const faceResult = detectFace(inputVideo, ts)
      if (faceResult) {
        applyFaceToVRM(faceResult, sceneCtx.vrm)
        updateStatsUI()
      }

      if (captureRange !== 'face' && poseTrackerReady) {
        const poseResult = detectPose(inputVideo, ts)
        const lms = poseResult?.worldLandmarks?.[0]
        if (lms) {
          applyUpperBodyToVRM(lms, sceneCtx.vrm)
          if (captureRange === 'full-body') {
            applyLowerBodyToVRM(lms, sceneCtx.vrm)
          }
        }
      }
    }
    requestAnimationFrame(detectLoop)
  }
  detectLoop()

  // --- カメラ開始 ---
  cameraStartBtn.addEventListener('click', async () => {
    try {
      setStatus('カメラ接続中…')
      if (captureRange !== 'face') await ensurePoseTracker()
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

  // --- カメラ停止 ---
  cameraStopBtn.addEventListener('click', () => {
    stopCamera(inputVideo, previewVideo)
    cameraRunning = false
    cameraStopBtn.classList.add('hidden')
    cameraStartBtn.classList.remove('hidden')
    setStatus('カメラ停止中')
  })

  // --- VRM ファイル読み込み ---
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
