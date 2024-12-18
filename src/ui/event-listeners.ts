import * as THREE from 'three'
import { sideMenu, toggleMenu } from '.'
import { AnimationHandler, moveAndFlip } from '../canvas/animations'
import { hoverCube, switchObjectSelectionState } from '../canvas/cube'
import { hoverTile } from '../canvas/tiles'

// Event Listeners
export const handleResize = (camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => (event: Event) => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

export const handleMouseClick =
  (
    animationHandler: AnimationHandler,
    mouse: THREE.Vector2,
    raycaster: THREE.Raycaster,
    camera: THREE.PerspectiveCamera,
    cube: THREE.Mesh,
    tiles: THREE.Mesh[]
  ) =>
  (event: MouseEvent) => {
    if (animationHandler.currentState) return

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const cubeIntersects = raycaster.intersectObject(cube)
    if (cubeIntersects.length > 0) {
      switchObjectSelectionState(cube, !cube.userData.isSelected)
      if (!sideMenu.classList.contains('hidden')) toggleMenu()
      return
    }

    const tileIntersects = raycaster.intersectObjects(tiles)
    if (tileIntersects.length > 0) {
      if (!sideMenu.classList.contains('hidden')) toggleMenu()

      if (cube.userData.isSelected) {
        const tile = tileIntersects[0].object
        moveAndFlip(cube, tile.position.clone(), animationHandler)
        switchObjectSelectionState(cube, false)
      }
    }
  }

export const handleMouseMove =
  (
    mouse: THREE.Vector2,
    raycaster: THREE.Raycaster,
    camera: THREE.PerspectiveCamera,
    cube: THREE.Mesh,
    tiles: THREE.Mesh[],
    animationHandler: AnimationHandler
  ) =>
  (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    let intersects = raycaster.intersectObjects([...tiles, cube])
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'

    intersects = raycaster.intersectObject(cube)
    if (!animationHandler.currentState) hoverCube(cube, intersects)

    intersects = raycaster.intersectObjects(tiles)
    hoverTile(tiles, intersects)
  }
