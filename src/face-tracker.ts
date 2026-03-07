import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision'

export type { FaceLandmarkerResult }

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

let landmarker: FaceLandmarker | null = null

export async function initFaceTracker(): Promise<void> {
  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN)
  landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
    runningMode: 'VIDEO',
    numFaces: 1,
  })
}

export function detectFace(
  video: HTMLVideoElement,
  timestampMs: number
): FaceLandmarkerResult | null {
  if (!landmarker) return null
  return landmarker.detectForVideo(video, timestampMs)
}
