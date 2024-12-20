import * as THREE from 'three'
import { sideMenu, toggleMenu } from '.'
import { AnimationHandler, moveAndFlip } from '../canvas/animations'
import { hoverCube, switchObjectSelectionState } from '../canvas/cube'
import { enemies } from '../canvas/enemies' // Import enemies
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
    tiles: THREE.Mesh[],
    spotLight: THREE.SpotLight
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

    const enemyIntersects = raycaster.intersectObjects(enemies)
    if (enemyIntersects.length > 0) {
      const enemy = enemyIntersects[0].object as THREE.Mesh
      switchObjectSelectionState(enemy, !enemy.userData.isSelected)
      if (!sideMenu.classList.contains('hidden')) toggleMenu()
      return
    }

    const tileIntersects = raycaster.intersectObjects(tiles)
    if (tileIntersects.length > 0) {
      if (!sideMenu.classList.contains('hidden')) toggleMenu()

      if (cube.userData.isSelected) {
        const tile = tileIntersects[0].object
        if (!tile.userData.isOccupied) {
          moveAndFlip(cube, tiles, tile.position.clone(), animationHandler, spotLight)
          switchObjectSelectionState(cube, false)
        } else {
          switchObjectSelectionState(cube, false)
          throw new Error("Can't move there! Tile is occupied")
        }
      }

      enemies.forEach(enemy => {
        if (enemy.userData.isSelected) {
          const tile = tileIntersects[0].object
          if (!tile.userData.isOccupied) {
            moveAndFlip(enemy, tiles, tile.position.clone(), animationHandler, spotLight)
            switchObjectSelectionState(enemy, false)
          } else {
            switchObjectSelectionState(enemy, false)
            throw new Error("Can't move there! Tile is occupied")
          }
        }
      })
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

    const objectsToIntersect = [...tiles, cube, ...enemies]
    let intersects = raycaster.intersectObjects(objectsToIntersect)
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'

    intersects = raycaster.intersectObjects(tiles)
    hoverTile(tiles, intersects)
    hoverCube(cube, [])
    enemies.forEach(enemy => hoverCube(enemy, []))

    intersects = raycaster.intersectObject(cube)
    if (!animationHandler.currentState && intersects.length > 0) {
      hoverCube(cube, intersects)
      hoverTile(tiles, [])
    }

    intersects = raycaster.intersectObjects(enemies)
    if (!animationHandler.currentState && intersects.length > 0) {
      const enemy = intersects[0].object as THREE.Mesh
      hoverCube(enemy, intersects)
      hoverTile(tiles, [])
    }
  }
