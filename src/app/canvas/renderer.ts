import * as THREE from 'three'
import camera from './camera'
import { scene } from './scene'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)

// Rendering Loop
export const render = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

export default renderer
