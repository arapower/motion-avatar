import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision'

export type { PoseLandmarkerResult }

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'

let poseLandmarker: PoseLandmarker | null = null

export async function initPoseTracker(): Promise<void> {
  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN)
  poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    outputSegmentationMasks: false,
  })
}

export function detectPose(
  video: HTMLVideoElement,
  timestampMs: number
): PoseLandmarkerResult | null {
  if (!poseLandmarker) return null
  return poseLandmarker.detectForVideo(video, timestampMs)
}
