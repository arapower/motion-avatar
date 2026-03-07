import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, type VRM } from '@pixiv/three-vrm'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export type CaptureRange = 'face' | 'upper-body' | 'full-body'

/** キャプチャー範囲ごとのカメラ位置・注視点プリセット */
const CAMERA_PRESETS: Record<CaptureRange, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  'face':       { pos: new THREE.Vector3(0, 1.4, 2.5), target: new THREE.Vector3(0, 1.3, 0) },
  'upper-body': { pos: new THREE.Vector3(0, 1.0, 3.8), target: new THREE.Vector3(0, 0.9, 0) },
  'full-body':  { pos: new THREE.Vector3(0, 0.9, 5.5), target: new THREE.Vector3(0, 0.9, 0) },
}

export interface SceneContext {
  renderer: THREE.WebGLRenderer
  vrm: VRM | null
  setVRM: (newVrm: VRM) => void
  setCaptureRange: (range: CaptureRange) => void
}

export function initScene(canvas: HTMLCanvasElement): SceneContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1e293b)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20)
  camera.position.set(0, 1.4, 2.5)

  const ambient = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambient)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
  dirLight.position.set(1, 2, 2)
  scene.add(dirLight)

  const controls = new OrbitControls(camera, canvas)
  controls.target.set(0, 1.2, 0)
  controls.update()

  const ctx: SceneContext = { renderer, vrm: null, setVRM: () => {}, setCaptureRange: () => {} }
  ctx.setVRM = (newVrm: VRM) => {
    if (ctx.vrm) {
      scene.remove(ctx.vrm.scene)
    }
    ctx.vrm = newVrm
    scene.add(newVrm.scene)
  }
  ctx.setCaptureRange = (range: CaptureRange) => {
    const preset = CAMERA_PRESETS[range]
    camera.position.copy(preset.pos)
    controls.target.copy(preset.target)
    controls.update()
  }

  // キャンバスサイズを親要素に合わせて更新
  const resizeObserver = new ResizeObserver(() => {
    const parent = canvas.parentElement
    if (!parent) return
    const w = parent.clientWidth
    const h = parent.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })
  resizeObserver.observe(canvas.parentElement!)

  const clock = new THREE.Clock()
  function animate() {
    requestAnimationFrame(animate)
    const delta = clock.getDelta()
    ctx.vrm?.update(delta)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  return ctx
}

export async function loadVRM(url: string, ctx: SceneContext): Promise<VRM> {
  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const gltf = await loader.loadAsync(url)
  const vrm: VRM = gltf.userData.vrm as VRM
  if (!vrm) throw new Error('VRM データが見つかりません')
  ctx.setVRM(vrm)
  return vrm
}
