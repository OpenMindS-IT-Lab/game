import { compact, values } from 'lodash'
import * as THREE from 'three'
import { Ally } from '../canvas'
import camera from '../canvas/camera'
import Tower from '../canvas/tower'
import { captureImage, handleMinorError } from '../utils'
import { hideTowerInfo } from './tower-info'

// Event Listeners
export const handleResize = (renderer: THREE.WebGLRenderer) => (_event: Event) => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// export const handleMouseClick =
//   (mouse: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) => (event: MouseEvent) => {
//     try {
//       // Обчислення нормалізованих координат миші
//       mouse.x = (event.clientX / window.innerWidth) * 2 - 1
//       mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

//       raycaster.setFromCamera(mouse, camera)

//       // Перевірка натискання на Tower
//       const allies = compact(values(tower.allies))
//       const alliesIntersects = raycaster.intersectObjects([tower, ...allies])

//       if (alliesIntersects.length > 0) {
//         const { object } = alliesIntersects[0] as THREE.Intersection & { object: Tower | Ally }
//         if (object.isSelected) {
//           object.unselect()
//         } else {
//           object.select()
//         }
//       } else if (
//         (event.target as EventTarget & { nodeName: string }).nodeName === 'CANVAS' ||
//         // (event.target as Element).id.endsWith('button')
//         (event.target as Element).id === 'start-level-button'
//       ) {
//         tower.unselectAllies()
//         tower.unselect()
//         hideTowerInfo()
//       }
//     } catch (error) {
//       handleMinorError(error)
//     }
//   }

export const handlePointerEvent =
  (pointer: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower) => (event: MouseEvent | TouchEvent) => {
    // if (animationHandler.currentState) return // Блокування під час анімації

    event.preventDefault() // Prevent default behavior (e.g., scrolling)

    try {
      let clientX: number, clientY: number

      if (event instanceof TouchEvent) {
        // Touch event
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
        // Telegram.WebApp.showAlert('touch')
      } else {
        // Mouse event
        clientX = event.clientX
        clientY = event.clientY
      }

      // Calculate normalized device coordinates
      pointer.x = (clientX / window.innerWidth) * 2 - 1
      pointer.y = -(clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(pointer, camera)

      // Check for intersections with Tower or Allies
      const allies = compact(values(tower.allies))
      const alliesIntersects = raycaster.intersectObjects([tower, ...allies])

      if (alliesIntersects.length > 0) {
        const { object } = alliesIntersects[0] as THREE.Intersection & {
          object: Tower | Ally
        }
        if (object.isSelected) {
          object.unselect()
        } else {
          object.select()
        }
      } else if (
        (event.target as EventTarget & { nodeName: string }).nodeName === 'CANVAS' ||
        (event.target as Element).id === 'start-level-button'
      ) {
        tower.unselectAllies()
        tower.unselect()
        hideTowerInfo()
      }
    } catch (error) {
      handleMinorError(error)
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
      // allies.forEach(ally => {
      // hoverObject(ally, intersects)
      // })
    } else {
      allies.forEach(ally => ((ally.material as THREE.MeshStandardMaterial).opacity = 1))
    }
  }

export const handleDoubleClick =
  (mouse: THREE.Vector2, raycaster: THREE.Raycaster, tower: Tower, gridHelper: THREE.GridHelper, plane: THREE.Mesh) =>
  (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Об'єкти для перевірки ховера
    const allies = [tower, ...compact(values(tower.allies))]
    const intersects = raycaster.intersectObjects(allies)

    if (intersects.length > 0) {
      const target = intersects[0].object

      if (!target) return

      const name = (target instanceof Ally ? target.allyTowerType : 'main') + '-tower'

      captureImage(target as Tower | Ally, name, gridHelper, plane)
    }
  }
