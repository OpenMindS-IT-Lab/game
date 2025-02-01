import * as THREE from 'three'
// import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass'
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { gameContainer, uiContainer } from '../ui'
import camera, { resetCamera } from './camera'
import { scene } from './scene'

const renderer = new THREE.WebGLRenderer({ antialias: true })

// Setup Game Container
if (!gameContainer || !uiContainer) throw new Error('Game and/or UI container not found!')

const initialWidth = window.innerWidth
const initialHeight = window.innerHeight

export const updateSize = (override?: { w: number; h: number }) => {
  const viewPortHeight = override ? override.h : Telegram.WebApp.viewportHeight ?? initialHeight
  const viewPortWidth = override ? override.w : window.innerWidth ?? initialWidth
  const currentViewPort = renderer.getCurrentViewport(new THREE.Vector4()).clone()

  currentViewPort.setW(viewPortWidth).setZ(viewPortHeight)

  renderer.setViewport(currentViewPort)
  renderer.setSize(viewPortWidth, viewPortHeight, true)
  // renderer.setSize(1920, 1080)
  renderer.setPixelRatio(window.devicePixelRatio * 2) // For high-DPI devices

  resetCamera()
}

updateSize({ w: initialWidth, h: initialHeight })

renderer.shadowMap.enabled = true // Увімкнення тіней на рівні рендера
renderer.shadowMap.type = THREE.PCFSoftShadowMap // М'які тіні

gameContainer.appendChild(renderer.domElement)

// Composer setup
// const composer = new EffectComposer(renderer)
// composer.addPass(new RenderPass(scene, camera))
// composer.addPass(new BloomPass(1.25))

// Rendering Loop
export const render = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(render)
  // composer.render()
}

export default renderer

// Telegram.WebApp.onEvent('viewportChanged', event => {
//   // const viewPort = renderer.getCurrentViewport(new THREE.Vector4())
//   // renderer.setViewport(new THREE.Vector4(0, 0, viewPort.width, Telegram.WebApp.viewportStableHeight))
//   if (event.isStateStable) updateSize()
// })
// Telegram.WebApp.onEvent('safeAreaChanged', () => updateSafeArea())
// Telegram.WebApp.onEvent('contentSafeAreaChanged', () => updateContentSafeArea())
