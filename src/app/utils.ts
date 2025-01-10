import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import camera, { resetCamera } from './canvas/camera'
import { Colors } from './canvas/constants'
import renderer from './canvas/renderer'
import { scene } from './canvas/scene'
import { tiles } from './canvas/tiles'

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

export function enableCameraDrag() {
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
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)
  renderer.domElement.addEventListener('mouseleave', onMouseUp) // Handle when mouse leaves the canvas

  // Return a cleanup function to remove event listeners
  return () => {
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('mouseup', onMouseUp)
    renderer.domElement.removeEventListener('mouseleave', onMouseUp)
  }
}

export function disableCameraDrag(disableHandler: ReturnType<typeof enableCameraDrag>) {
  if (disableHandler) disableHandler() // Call the cleanup function returned by `enableCameraDrag`
}

export function enableMouseWheelTilt() {
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
    camera.position.y = initialHeight * (1.25 - tiltRatio)

    console.log(camera.position, camera.rotation)
  }

  // Додаємо слухача події
  renderer.domElement.addEventListener('wheel', onWheel, { passive: true })

  // Повертаємо функцію для очищення
  return () => {
    renderer.domElement.removeEventListener('wheel', onWheel)
  }
}
//! TRY ORBIT CPNTROL
export function disableMouseWheelTilt(disableHandler: ReturnType<typeof enableMouseWheelTilt>) {
  if (disableHandler) disableHandler()
}

export function checkCollision(object: THREE.Mesh, objects: THREE.Mesh[]) {
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

export function checkCollisionsAll(object: THREE.Mesh) {
  const objectBoundingBox = object.userData.boundingBox as THREE.Box3
  objectBoundingBox.setFromObject(object)

  const collisions = scene.children.filter(child => {
    if (object === child) return false

    if ('boundingBox' in child.userData) {
      const otherBoundingBox = child.userData.boundingBox as THREE.Box3
      otherBoundingBox.setFromObject(child)
      return objectBoundingBox.intersectsBox(otherBoundingBox)
    }

    return false
  })

  return collisions
}

export function deleteAllObjects() {
  const objectsToRemove: THREE.Object3D<THREE.Object3DEventMap>[] = []

  scene.traverse(object => {
    if (!object.userData.isPersistant) {
      objectsToRemove.push(object)
    }
  })

  scene.remove(...objectsToRemove)
}

export const resetScene = () => {
  deleteAllObjects() // Видаляємо всі об'єкти
  tiles.forEach((tile: THREE.Mesh) => {
    if (tile.position.x === 0 && tile.position.z === 14) tile.userData.isOccupied = true
    else tile.userData.isOccupied = false
  })

  resetCamera()

  console.log(tiles)
}

let damageTextCounter = 0
// Функція для відображення тексту пошкодження
export function showDamageText(damage: number, position: THREE.Vector3, color?: number) {
  if (damageTextCounter >= 20) return

  damageTextCounter++
  const loader = new FontLoader()
  loader.load('/src/app/assets/helvetiker_regular.typeface.json', font => {
    const geometry = new TextGeometry(`-${damage}`, {
      font: font,
      size: 0.2,
      depth: 0.1,
      // bevelEnabled: true,
      // bevelThickness: 0.02,
      // bevelSize: 0.02,
      // bevelOffset: 0,
    })
    const material = new THREE.MeshBasicMaterial({ ...Colors.DAMAGE_TEXT, color })
    const textMesh = new THREE.Mesh(geometry, material)

    textMesh.position.copy(position)
    textMesh.position.y += 1 // Піднімаємо текст над баштою
    const cameraPosition = camera.position.clone().setX(position.x)
    textMesh.lookAt(cameraPosition)
    const distanceToCamera = textMesh.position.distanceTo(cameraPosition)
    textMesh.scale.setScalar(distanceToCamera / 14)

    scene.add(textMesh)

    const textInitialPosition = textMesh.position.clone().y
    let animateText = setInterval(() => {
      textMesh.position.y += 1 / 15
      textMesh.material.opacity -= 1 / 15
      textMesh.lookAt(cameraPosition)

      if (textMesh.position.y >= textInitialPosition + 1) {
        damageTextCounter--
        clearInterval(animateText)
        scene.remove(textMesh)
      }
    }, 250 / 15)
  })
}

export type Timeout = NodeJS.Timeout | 0
