import * as THREE from 'three'
import { tiles } from './tiles'

export class AnimationHandler {
  protected _isAnimating = false

  get currentState(): boolean {
    return this._isAnimating
  }
  set currentState(value: boolean) {
    this._isAnimating = value
  }

  constructor(defaultState: boolean = false) {
    this.currentState = defaultState
  }

  switchState(newState?: boolean) {
    if (typeof newState === 'undefined') this.currentState = !this.currentState
    else this.currentState = newState
  }
}

// Animation
// 2. Функція для запуску анімації
export function moveAndFlip(
  object: THREE.Mesh,
  // tiles: THREE.Mesh[],
  targetPosition: THREE.Vector3,
  handler: AnimationHandler,
  spotLight: THREE.SpotLight
) {
  handler.switchState(true) // Блокування повторного запуску

  const initialPosition = object.position.clone()
  const initialRotation = object.rotation.clone()
  let elapsed = 0 // Час, який минув

  function animate() {
    const frameTime = 0.0128 // Фіксована частка часу для кожного кадру
    elapsed += frameTime

    // Стрибок: синусоїдальний рух по осі Y
    object.position.y = initialPosition.y + Math.sin(elapsed * Math.PI) * 6

    // Обертання об'єкта
    object.rotation.x += 0.04
    object.rotation.z -= 0.04

    // Лінійне наближення до цільової позиції (якщо вказано)
    if (targetPosition) {
      object.position.x += (targetPosition.x - initialPosition.x) * frameTime
      object.position.z += (targetPosition.z - initialPosition.z) * frameTime

      spotLight.position.x = object.position.x
      spotLight.position.z = object.position.z / 2
      spotLight.position.y = object.position.y + 10
    }

    // Завершення анімації, коли elapsed досягає 1
    if (elapsed >= 1) {
      object.position.x = targetPosition?.x ?? initialPosition.x
      object.position.z = targetPosition?.z ?? initialPosition.z
      object.position.round()
      object.position.y = initialPosition.y // Повернення на початкову висоту

      object.rotation.copy(initialRotation) // Скидання обертання
      handler.switchState(false)

      tiles.find(
        tile => tile.position.x === object.position.x && tile.position.z === object.position.z
      )!.userData.isOccupied = true

      tiles.find(
        tile => tile.position.x === initialPosition.x && tile.position.z === initialPosition.z
      )!.userData.isOccupied = false

      return
    }

    // Запускаємо наступний кадр
    requestAnimationFrame(animate)
  }

  animate()
}

export function flickerLight(pointLight: THREE.PointLight) {
  let lightIntensity = 20
  pointLight.intensity = lightIntensity

  function animate() {
    lightIntensity = (Math.sin(Date.now() * 0.0025) + 1.25) / 2 // Значення між 0 і 1

    pointLight.intensity = lightIntensity * 20 // Масштабуємо до бажаного рівня

    requestAnimationFrame(animate)
  }

  animate()
}

export function moveLinear(object: THREE.Mesh, targetPosition: THREE.Vector3, handler: AnimationHandler) {
  handler.switchState(true) // Блокування повторного запуску

  const initialPosition = object.position.clone()
  let elapsed = 0 // Час, який минув

  function animate() {
    const frameTime = 0.0128 // Фіксована частка часу для кожного кадру
    elapsed += frameTime

    // Лінійне наближення до цільової позиції
    if (targetPosition) {
      object.position.x += (targetPosition.x - initialPosition.x) * frameTime
      object.position.z += (targetPosition.z - initialPosition.z) * frameTime
    }

    // Завершення анімації, коли elapsed досягає 1
    if (elapsed >= 1) {
      object.position.x = targetPosition?.x ?? initialPosition.x
      object.position.z = targetPosition?.z ?? initialPosition.z

      handler.switchState(false) // Розблокування

      // Оновлення статусу плитки
      const targetTile = tiles.find(
        tile => tile.position.x === object.position.x && tile.position.z === object.position.z
      )
      if (targetTile) targetTile.userData.isOccupied = true

      const initialTile = tiles.find(
        tile => tile.position.x === initialPosition.x && tile.position.z === initialPosition.z
      )
      if (initialTile) initialTile.userData.isOccupied = false

      return
    }

    // Запускаємо наступний кадр
    requestAnimationFrame(animate)
  }

  animate()
}
