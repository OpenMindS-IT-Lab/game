import * as THREE from 'three'
import { moveAndFlip } from './animations'
import createCube, { switchObjectSelectionState } from './cube'
import createGround from './ground'
import { createAmbienLight, createDirectionalLight, createPointLight, createSpotLight } from './light'
import createTiles, { hoverTile } from './tiles'

// Setup Game Container
const gameContainer = document.getElementById('game-container')
if (!gameContainer) throw new Error('Game container not found')

// Scene, Camera, Renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 20, 1)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
gameContainer.appendChild(renderer.domElement)

// Ground and Grid
const { gridHelper, plane } = createGround(scene)

// Tiles
const tiles: THREE.Mesh[] = createTiles(scene, 2)

// Cube
const cube = createCube(scene, 2)

// Raycaster
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Lighting
const ambientLight = createAmbienLight(scene)
const directionalLight = createDirectionalLight(scene)
const spotLight = createSpotLight(scene, cube)
const { lightSphere, pointLight } = createPointLight(scene)

// Animation Handler
let isAnimating = false

let lightIntensity = 0
function animateLights() {
  lightIntensity = (Math.sin(Date.now() * 0.005) + 1) / 2 // Значення між 0 і 1
  pointLight.intensity = lightIntensity * 5 // Масштабуємо до бажаного рівня
  requestAnimationFrame(animateLights)
}
animateLights()

renderer.shadowMap.enabled = true // Увімкнення тіней на рівні рендера
renderer.shadowMap.type = THREE.PCFSoftShadowMap // М'які тіні

// Об'єкти
cube.castShadow = true
plane.receiveShadow = true
tiles.forEach(tile => (tile.receiveShadow = true))

// Event Listeners
const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// Додаємо логіку для меню
const menuToggle = document.getElementById('burger-button') as Element
const sideMenu = document.getElementById('side-menu') as Element
const closeButton = document.getElementById('close-button') as Element

function toggleMenu() {
  sideMenu.classList.toggle('hidden') // Відкриваємо/закриваємо меню
  console.log('here')
}

closeButton.addEventListener('click', toggleMenu)

menuToggle.addEventListener('click', toggleMenu)

const handleMouseClick = (event: MouseEvent) => {
  if (isAnimating) return

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const cubeIntersects = raycaster.intersectObject(cube)
  if (cubeIntersects.length > 0) {
    switchObjectSelectionState(cube, !cube.userData.isSelected)
    if (!sideMenu.classList.contains('hidden')) toggleMenu()
    return
  }

  const tileIntersects = raycaster.intersectObjects(tiles)
  if (tileIntersects.length > 0) {
    if (!sideMenu.classList.contains('hidden')) toggleMenu()

    if (cube.userData.isSelected) {
      const tile = tileIntersects[0].object
      moveAndFlip(cube, tile.position.clone(), isAnimating)
      switchObjectSelectionState(cube, false)
    }
  }
}

const handleMouseMove = (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects([...tiles, cube])
  document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'

  hoverTile(tiles, intersects)
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
