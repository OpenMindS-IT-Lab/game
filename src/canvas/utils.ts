import * as THREE from 'three'
import { Colors } from './constants'

// Utility: Switch Cube State
export const switchObjectSelectionState = (object: THREE.Mesh, selected: boolean) => {
  const { initialColor } = object.userData

  object.material = new THREE.MeshStandardMaterial(selected ? Colors.SELECTED_TOWER : initialColor)
  object.userData.isSelected = selected
}

export function hoverObject(object: THREE.Mesh, intersects: THREE.Intersection[]) {
  const isHovered = intersects.length > 0 && intersects[0].object === object

  ;(object.material as THREE.MeshStandardMaterial).opacity = isHovered ? 0.6 : 1
}

export function enableCameraDrag(camera: THREE.PerspectiveCamera, { domElement }: THREE.Renderer) {
  let isDragging = false // Track if the mouse is being dragged
  let previousMousePosition = { x: 0, y: 0 } // Previous mouse position

  const onMouseDown = (event: MouseEvent) => {
    isDragging = true
    previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging) return

    // Calculate movement delta
    const deltaX = event.clientX - previousMousePosition.x
    const deltaY = event.clientY - previousMousePosition.y

    // Adjust camera position based on mouse movement
    const movementSpeed = 0.05 // Sensitivity of camera movement
    camera.position.x -= deltaX * movementSpeed
    camera.position.z -= deltaY * movementSpeed

    // Update previous mouse position
    previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  const onMouseUp = () => {
    isDragging = false // Stop dragging
  }

  // Attach event listeners
  domElement.addEventListener('mousedown', onMouseDown)
  domElement.addEventListener('mousemove', onMouseMove)
  domElement.addEventListener('mouseup', onMouseUp)
  domElement.addEventListener('mouseleave', onMouseUp) // Handle when mouse leaves the canvas

  // Return a cleanup function to remove event listeners
  return () => {
    domElement.removeEventListener('mousedown', onMouseDown)
    domElement.removeEventListener('mousemove', onMouseMove)
    domElement.removeEventListener('mouseup', onMouseUp)
    domElement.removeEventListener('mouseleave', onMouseUp)
  }
}

export function disableCameraDrag(disableHandler: ReturnType<typeof enableCameraDrag>) {
  if (disableHandler) disableHandler() // Call the cleanup function returned by `enableCameraDrag`
}

export function enableMouseWheelTilt(camera: THREE.PerspectiveCamera, { domElement }: THREE.Renderer) {
  const maxTilt = Math.PI / 2 // Максимальний нахил (90°)
  const minTilt = -Math.PI / 2 // Мінімальний нахил (-90°)
  const tiltSpeed = 0.002 // Чутливість нахилу
  const initialHeight = camera.position.y // Початкова висота камери

  const onWheel = (event: MouseEvent & { deltaY: number }) => {
    // Запобігаємо небажаним прокручуванням сторінки
    // event.preventDefault()

    // Обчислюємо новий кут нахилу
    const delta = event.deltaY * tiltSpeed // Рух колеса
    const newTilt = THREE.MathUtils.clamp(camera.rotation.x + delta, minTilt, maxTilt)

    camera.rotation.x = newTilt

    // Змінюємо висоту камери пропорційно зміні куту нахилу
    const tiltRatio = (newTilt - minTilt) / (maxTilt - minTilt)
    camera.position.y = initialHeight * (1 - 2 * tiltRatio)
  }

  // Додаємо слухача події
  domElement.addEventListener('wheel', onWheel, { passive: true })

  // Повертаємо функцію для очищення
  return () => {
    domElement.removeEventListener('wheel', onWheel)
  }
}

export function disableMouseWheelTilt(disableHandler: ReturnType<typeof enableMouseWheelTilt>) {
  if (disableHandler) disableHandler()
}

export function checkCollisions(object: THREE.Mesh, objects: THREE.Mesh[]) {
  if (objects.length > 0) {
    const objectBoundingBox = object.userData.boundingBox as THREE.Box3
    objectBoundingBox.setFromObject(object)

    for (const otherObject of objects) {
      if (object === otherObject) continue

      const otherBoundingBox = otherObject.userData.boundingBox as THREE.Box3
      otherBoundingBox.setFromObject(otherObject)

      if (objectBoundingBox.intersectsBox(otherBoundingBox)) {
        return otherObject
      }
    }
  }

  return null
}

export function checkCollisionsAll(object: THREE.Mesh, objects: THREE.Mesh[]) {
  const objectBoundingBox = object.userData.boundingBox as THREE.Box3
  objectBoundingBox.setFromObject(object)

  return objects.filter(otherObject => {
    if (object === otherObject) return false

    const otherBoundingBox = otherObject.userData.boundingBox as THREE.Box3
    otherBoundingBox.setFromObject(otherObject)

    return objectBoundingBox.intersectsBox(otherBoundingBox)
  })
}
