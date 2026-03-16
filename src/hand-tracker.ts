import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision'

export type { HandLandmarkerResult }

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

let handLandmarker: HandLandmarker | null = null

export async function initHandTracker(): Promise<void> {
  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN)
  handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  })
}

export function detectHands(
  video: HTMLVideoElement,
  timestampMs: number
): HandLandmarkerResult | null {
  if (!handLandmarker) return null
  return handLandmarker.detectForVideo(video, timestampMs)
}
