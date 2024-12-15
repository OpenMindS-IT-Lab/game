import * as THREE from 'three'

// Setup Game Container
const gameContainer = document.getElementById('game-container')
if (!gameContainer) throw new Error('Game container not found')

// Scene, Camera, Renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 15, 0)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
gameContainer.appendChild(renderer.domElement)

// Lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0, 200, -50)
scene.add(directionalLight)

// Color Definitions
const Colors = {
  TILE: { color: 0xff4444, transparent: true, opacity: 0 },
  CUBE: { color: 0x2194ce },
  SELECTED_CUBE: { color: 0x00ff28 },
  PLANE: 0x202020,
}

// Ground and Grid
const createGround = () => {
  const gridHelper = new THREE.GridHelper(30, 15, 0x444444, 0x111111)
  scene.add(gridHelper)

  const planeGeometry = new THREE.PlaneGeometry(14, 30)
  const planeMaterial = new THREE.MeshStandardMaterial({ color: Colors.PLANE })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.01
  scene.add(plane)
}
createGround()

// Tiles
const tiles: THREE.Mesh[] = []
const createTiles = () => {
  const tileSize = 2

  for (let x = -3; x <= 3; x++) {
    for (let z = -7; z <= 7; z++) {
      const tileGeometry = new THREE.BoxGeometry(tileSize, 0, tileSize)
      const tileMaterial = new THREE.MeshStandardMaterial(Colors.TILE)
      const tile = new THREE.Mesh(tileGeometry, tileMaterial)

      tile.position.set(x * tileSize, 0, z * tileSize)
      tile.userData = { active: false }
      tiles.push(tile)
      scene.add(tile)
    }
  }
}
createTiles()

// Cube
const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial(Colors.CUBE))
cube.position.set(0, 0, 0)
cube.userData = { isSelected: false }
scene.add(cube)

// Raycaster
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Animation Handler
let isAnimating = false

// Animation
// 2. Функція для запуску анімації
function startAnimation(object: THREE.Mesh, targetPosition: THREE.Vector3) {
  isAnimating = true // Блокування повторного запуску

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
      isAnimating = false // Розблокування
      return
    }

    // Запускаємо наступний кадр
    requestAnimationFrame(animate)
  }

  animate()
}

// Utility: Switch Cube State
const switchObjectSelectionState = (object: THREE.Mesh, selected: boolean) => {
  object.material = new THREE.MeshStandardMaterial(selected ? Colors.SELECTED_CUBE : Colors.CUBE)
  object.userData.isSelected = selected
}

// Event Listeners
const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

const handleMouseClick = (event: MouseEvent) => {
  if (isAnimating) return

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const cubeIntersects = raycaster.intersectObject(cube)
  if (cubeIntersects.length > 0) {
    switchObjectSelectionState(cube, !cube.userData.isSelected)
    return
  }

  const tileIntersects = raycaster.intersectObjects(tiles)
  if (tileIntersects.length > 0 && cube.userData.isSelected) {
    const tile = tileIntersects[0].object
    startAnimation(cube, tile.position.clone())
    switchObjectSelectionState(cube, false)
  }
}

const handleMouseMove = (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(tiles)
  document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
}

// Rendering Loop
const render = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

// Initialize
window.addEventListener('resize', handleResize)
window.addEventListener('click', handleMouseClick)
window.addEventListener('mousemove', handleMouseMove)

render()
