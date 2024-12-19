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
  if (disableHandler) {
    disableHandler() // Call the cleanup function returned by `enableCameraDrag`
  }
}