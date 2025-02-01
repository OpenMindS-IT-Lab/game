import * as THREE from 'three'
import { tiles } from './tiles'

const FRAME_TIME = 0.0128 // Fixed time fraction for each frame

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
  targetPosition: THREE.Vector3,
  animationHandler?: AnimationHandler,
  spotLight?: THREE.SpotLight,
  cb?: () => void
) {
  ;((object.userData.isAnimating as AnimationHandler) ?? animationHandler).switchState(true)
  // Block re-triggering
  const initialPosition = object.position.clone()
  const initialRotation = object.rotation.clone()
  let elapsed = 0 // Elapsed time

  function animate() {
    elapsed += FRAME_TIME

    // Jump: sinusoidal movement along the Y-axis
    object.position.y = initialPosition.y + Math.sin(elapsed * Math.PI) * 2

    // Rotate the object
    object.rotation.x += 0.04
    object.rotation.z -= 0.04

    // Linear approach to the target position (if specified)
    if (targetPosition) {
      object.position.x += (targetPosition.x - initialPosition.x) * FRAME_TIME
      object.position.z += (targetPosition.z - initialPosition.z) * FRAME_TIME

      if (spotLight) {
        spotLight.position.x = object.position.x
        spotLight.position.z = object.position.z / 2
        spotLight.position.y = object.position.y + 10
      }
    }

    // End animation when elapsed reaches 1
    if (elapsed >= 1) {
      object.position.x = targetPosition?.x ?? initialPosition.x
      object.position.z = targetPosition?.z ?? initialPosition.z
      // object.position.round()
      object.position.y = initialPosition.y // Return to initial height

      object.rotation.copy(initialRotation) // Reset rotation
      ;((object.userData.isAnimating as AnimationHandler) ?? animationHandler).switchState(false)
      const prevTile = tiles.find(
        tile => tile.position.x === object.position.x && tile.position.z === object.position.z
      )
      if (prevTile) prevTile.userData.isOccupied = true

      const currTile = tiles.find(
        tile => tile.position.x === initialPosition.x && tile.position.z === initialPosition.z
      )
      if (currTile) currTile.userData.isOccupied = false

      if (typeof cb === 'function') cb()

      return
    }

    // Trigger the next frame
    requestAnimationFrame(animate)
  }

  animate()
}

export function flickerLight(pointLight: THREE.PointLight) {
  let stop = true
  let lightIntensity = 20

  pointLight.intensity = lightIntensity

  function animate() {
    if (stop) return

    lightIntensity = (Math.sin(Date.now() * 0.0025) + 1) / 2 // Значення між 0 і 1

    pointLight.intensity = lightIntensity * 20 // Масштабуємо до бажаного рівня

    requestAnimationFrame(animate)
  }

  animate()

  return {
    pause() {
      stop = true
      pointLight.color.set(0x00ff00)
      pointLight.intensity = 0.2
    },
    resume() {
      stop = false
      pointLight.color.set(0xff0000)
      animate()
    },
  }
}

export function moveLinear(
  object: THREE.Mesh,
  targetPosition: THREE.Vector3,
  animationHandler?: AnimationHandler,
  cb?: () => void,
  speed: number = 1
) {
  ;((object.userData.isAnimating as AnimationHandler) ?? animationHandler).switchState(true) // Блокування повторного запуску

  const initialPosition = object.position.clone()
  let elapsed = 0 // Час, який минув

  function animate() {
    const frameTime = 0.1024 * speed // Фіксована частка часу для кожного кадру
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
      ;((object.userData.isAnimating as AnimationHandler) ?? animationHandler).switchState(false) // Розблокування

      // Оновлення статусу плитки
      const targetTile = tiles.find(
        tile => tile.position.x === object.position.x && tile.position.z === object.position.z
      )
      if (targetTile) targetTile.userData.isOccupied = true

      const initialTile = tiles.find(
        tile => tile.position.x === initialPosition.x && tile.position.z === initialPosition.z
      )
      if (initialTile) initialTile.userData.isOccupied = false

      if (typeof cb === 'function') cb()

      return
    }

    // Запускаємо наступний кадр
    requestAnimationFrame(animate)
  }

  animate()
}
