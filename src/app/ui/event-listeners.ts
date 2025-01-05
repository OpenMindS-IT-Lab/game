import * as THREE from 'three'
import { AnimationHandler, moveAndFlip, moveLinear } from '../canvas/animations'
import camera from '../canvas/camera'
import { hoverTile, tiles } from '../canvas/tiles'
import { hoverObject, switchObjectSelectionState } from '../canvas/utils'

// Event Listeners
export const handleResize = (renderer: THREE.WebGLRenderer) => (_event: Event) => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

export const handleMouseClick =
  (
    animationHandler: AnimationHandler,
    mouse: THREE.Vector2,
    raycaster: THREE.Raycaster,
    // camera: THREE.PerspectiveCamera,
    tower: THREE.Mesh,
    // tiles: THREE.Mesh[],
    enemies: THREE.Mesh[],
    spotLight: THREE.SpotLight
  ) =>
  (event: MouseEvent) => {
    if (animationHandler.currentState) return // Блокування під час анімації

    // Обчислення нормалізованих координат миші
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Скидання вибору для всіх об'єктів
    const resetSelections = () => {
      ;[tower, ...enemies].forEach(obj => {
        if (obj.userData.isSelected) {
          obj.userData.isSelected = false
          switchObjectSelectionState(obj, false)
        }
      })
    }

    // Перевірка натискання на Tower
    const towerIntersects = raycaster.intersectObject(tower)
    if (towerIntersects.length > 0) {
      if (tower.userData.isSelected) {
        // Якщо Tower вже вибраний, скасовуємо його вибір
        tower.userData.isSelected = false
        switchObjectSelectionState(tower, false)
        return
      }
      resetSelections() // Скидаємо всі попередні вибори
      switchObjectSelectionState(tower, true)
      return
    }

    // Перевірка натискання на Enemy
    const enemyIntersects = raycaster.intersectObjects(enemies)
    if (enemyIntersects.length > 0) {
      const enemy = enemyIntersects[0].object as THREE.Mesh
      if (enemy.userData.isSelected) {
        // Якщо Enemy вже вибраний, скасовуємо його вибір
        enemy.userData.isSelected = false
        switchObjectSelectionState(enemy, false)
        return
      }
      resetSelections() // Скидаємо всі попередні вибори
      switchObjectSelectionState(enemy, true)
      return
    }

    // Перевірка натискання на Tile
    const tileIntersects = raycaster.intersectObjects(tiles)
    if (tileIntersects.length > 0) {
      const tile = tileIntersects[0].object as THREE.Mesh

      if (tower.userData.isSelected) {
        // Tower: перевірка та переміщення
        if (!tile.userData.isOccupied) {
          resetSelections()
          moveAndFlip(tower, tile.position.clone(), animationHandler, spotLight)
        } else {
          console.error("Can't move there! Tile is occupied")
        }
        return
      }

      const selectedEnemy = enemies.find(enemy => enemy.userData.isSelected)
      if (selectedEnemy) {
        // Enemy: перевірка та переміщення
        if (!tile.userData.isOccupied) {
          resetSelections()
          moveLinear(selectedEnemy, tile.position.clone(), animationHandler)
        } else {
          console.error("Can't move there! Tile is occupied")
        }
        return
      }
    }
  }

export const handleMouseMove =
  (
    mouse: THREE.Vector2,
    raycaster: THREE.Raycaster,
    // camera: THREE.PerspectiveCamera,
    tower: THREE.Mesh,
    // tiles: THREE.Mesh[],
    enemies: THREE.Mesh[],
    animationHandler: AnimationHandler
  ) =>
  (event: MouseEvent) => {
    // Оновлюємо позицію миші
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Об'єкти для перевірки ховера
    const objectsToIntersect = [...tiles, tower, ...enemies]
    const intersects = raycaster.intersectObjects(objectsToIntersect)

    // Оновлюємо курсор миші
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'

    // Скидаємо ховер для всіх плиток та об'єктів
    hoverTile([])
    hoverObject(tower, [])
    enemies.forEach(enemy => hoverObject(enemy, []))

    if (animationHandler.currentState) return // Блокуємо ховер під час анімації

    // Ховер для плиток
    const tileIntersects = raycaster.intersectObjects(tiles)
    if (tileIntersects.length > 0) {
      hoverTile(tileIntersects)
    }

    // Ховер для Tower
    const towerIntersects = raycaster.intersectObject(tower)
    if (towerIntersects.length > 0) {
      hoverObject(tower, towerIntersects)
      return // Пріоритет для Tower
    }

    // Ховер для ворогів
    const enemyIntersects = raycaster.intersectObjects(enemies)
    if (enemyIntersects.length > 0) {
      const hoveredEnemy = enemyIntersects[0].object as THREE.Mesh
      hoverObject(hoveredEnemy, enemyIntersects)
    }
  }
