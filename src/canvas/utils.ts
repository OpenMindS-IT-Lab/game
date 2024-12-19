import * as THREE from 'three'

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

  const onWheel = (event: MouseEvent & { deltaY: number }) => {
    // Запобігаємо небажаним прокручуванням сторінки
    // event.preventDefault()
    camera.position.y = 2

    // Обчислюємо новий кут нахилу
    const delta = event.deltaY * tiltSpeed // Рух колеса
    const newTilt = THREE.MathUtils.clamp(camera.rotation.x + delta, minTilt, maxTilt)

    camera.rotation.x = newTilt
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
