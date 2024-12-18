import * as THREE from 'three'

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
export function moveAndFlip(object: THREE.Mesh, targetPosition: THREE.Vector3, handler: AnimationHandler) {
  handler.switchState(true) // Блокування повторного запуску

  const initialPosition = object.position.clone()
  const initialRotation = object.rotation.clone()
  let elapsed = 0 // Час, який минув

  function animate() {
    const frameTime = 0.0128 // Фіксована частка часу для кожного кадру
    elapsed += frameTime

    // Стрибок: синусоїдальний рух по осі Y
    object.position.y = initialPosition.y + Math.sin(elapsed * Math.PI) * 3

    // Обертання об'єкта
    object.rotation.x += 0.04
    object.rotation.z -= 0.04

    // Лінійне наближення до цільової позиції (якщо вказано)
    if (targetPosition) {
      object.position.x += (targetPosition.x - initialPosition.x) * frameTime
      object.position.z += (targetPosition.z - initialPosition.z) * frameTime
    }

    // Завершення анімації, коли elapsed досягає 1
    if (elapsed >= 1) {
      object.position.y = initialPosition.y // Повернення на початкову висоту
      object.position.x = targetPosition?.x ?? initialPosition.x
      object.position.z = targetPosition?.z ?? initialPosition.z

      object.rotation.copy(initialRotation) // Скидання обертання
      handler.switchState(false)
      return
    }

    // Запускаємо наступний кадр
    requestAnimationFrame(animate)
  }

  animate()
}

export function flickerLight(pointLight: THREE.PointLight) {
  let lightIntensity = 0

  function animate() {
    lightIntensity = (Math.sin(Date.now() * 0.005) + 1) / 2 // Значення між 0 і 1

    pointLight.intensity = lightIntensity * 5 // Масштабуємо до бажаного рівня

    requestAnimationFrame(animate)
  }

  animate()
}
