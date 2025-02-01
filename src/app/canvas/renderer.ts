import * as THREE from 'three'
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

  resetCamera()
}

// export const updateSafeArea = () => {
//   const contentSafeArea = Telegram.WebApp.contentSafeAreaInset

//   uiContainer.style.margin = `${contentSafeArea.top}px ${contentSafeArea.right}px ${contentSafeArea.bottom}px ${contentSafeArea.left}px`
// }

// export const updateContentSafeArea = () => {
//   const safeArea = Telegram.WebApp.safeAreaInset

//   gameContainer.style.padding = `${safeArea.top}px ${safeArea.right}px ${safeArea.bottom}px ${safeArea.left}px`
// }

updateSize({ w: initialWidth, h: initialHeight })
// updateSafeArea()
// updateContentSafeArea()

renderer.shadowMap.enabled = true // Увімкнення тіней на рівні рендера
renderer.shadowMap.type = THREE.PCFSoftShadowMap // М'які тіні

gameContainer.appendChild(renderer.domElement)

// Rendering Loop
export const render = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

export default renderer

// Telegram.WebApp.onEvent('viewportChanged', event => {
//   // const viewPort = renderer.getCurrentViewport(new THREE.Vector4())
//   // renderer.setViewport(new THREE.Vector4(0, 0, viewPort.width, Telegram.WebApp.viewportStableHeight))
//   if (event.isStateStable) updateSize()
// })
// Telegram.WebApp.onEvent('safeAreaChanged', () => updateSafeArea())
// Telegram.WebApp.onEvent('contentSafeAreaChanged', () => updateContentSafeArea())
