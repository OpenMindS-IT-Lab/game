import { compact, values } from 'lodash'
import * as THREE from 'three'
import { Ally } from '../canvas'
import camera from '../canvas/camera'
import Tower from '../canvas/tower'
import { hoverObject /* , switchObjectSelectionState */ } from '../utils'
import { hideTowerInfo } from './tower-info'

// Event Listeners
export const handleResize = (renderer: THREE.WebGLRenderer) => (_event: Event) => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

export const handleMouseClick =
  (mouse: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) => (event: MouseEvent) => {
    // if (animationHandler.currentState) return // Блокування під час анімації

    // Обчислення нормалізованих координат миші
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Перевірка натискання на Tower
    const allies = compact(values(tower.allies))
    const alliesIntersects = raycaster.intersectObjects([tower, ...allies])

    if (alliesIntersects.length > 0) {
      const { object } = alliesIntersects[0] as THREE.Intersection & { object: Tower | Ally }
      if (object.isSelected) {
        object.unselect()
      } else {
        object.select()
      }
    } else if (
      (event.target as EventTarget & { nodeName: string }).nodeName === 'CANVAS' ||
      // (event.target as Element).id.endsWith('button')
      (event.target as Element).id === 'start-level-button'
    ) {
      tower.unselectAllies()
      tower.unselect()
      hideTowerInfo()
    }
  }

export const handleMouseMove =
  (mouse: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) => (event: MouseEvent) => {
    // Оновлюємо позицію миші
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Об'єкти для перевірки ховера
    const allies = [tower, ...compact(values(tower.allies))]
    const intersects = raycaster.intersectObjects(allies)

    // Оновлюємо курсор миші
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'

    if (intersects.length > 0) {
      allies.forEach(ally => {
        hoverObject(ally, intersects)
      })
    } else {
      allies.forEach(ally => ((ally.material as THREE.MeshStandardMaterial).opacity = 1))
    }
  }
