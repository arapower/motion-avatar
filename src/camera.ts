export async function setupCamera(
  inputVideo: HTMLVideoElement,
  previewVideo: HTMLVideoElement
): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode: 'user' },
    audio: false,
  })
  inputVideo.srcObject = stream
  previewVideo.srcObject = stream
  await Promise.all([
    new Promise<void>(resolve => {
      inputVideo.onloadedmetadata = () => resolve()
    }),
    new Promise<void>(resolve => {
      previewVideo.onloadedmetadata = () => resolve()
    }),
  ])
  await inputVideo.play()
  await previewVideo.play()
}

export function stopCamera(
  inputVideo: HTMLVideoElement,
  previewVideo: HTMLVideoElement
): void {
  const stream = inputVideo.srcObject as MediaStream | null
  stream?.getTracks().forEach(t => t.stop())
  inputVideo.srcObject = null
  previewVideo.srcObject = null
}
