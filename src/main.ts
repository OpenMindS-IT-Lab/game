import * as THREE from 'three'
import { AnimationHandler, flickerLight } from './canvas/animations'
import createCube from './canvas/cube'
import { spawnCube, spawnIcosahedron, spawnPyramid, spawnSphere } from './canvas/enemies'
import createGround from './canvas/ground'
import { createAmbienLight, createDirectionalLight, createPointLight, createSpotLight } from './canvas/light'
import createTiles from './canvas/tiles'
import './ui'
import { resetSceneButton, spawnCubeButton, spawnIcosahedronButton, spawnPyramidButton, spawnSphereButton } from './ui'
import { handleMouseClick, handleMouseMove, handleResize } from './ui/event-listeners'

// Setup Game Container
const gameContainer = document.getElementById('game-container')
if (!gameContainer) throw new Error('Game container not found')

// Scene, Camera, Renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 20, 1)
camera.lookAt(0, 0, 0)
camera.userData = { isPersistant: true }

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
flickerLight(pointLight)

// Animation Handlers
const isCubeAnimating = new AnimationHandler(false)

renderer.shadowMap.enabled = true // Увімкнення тіней на рівні рендера
renderer.shadowMap.type = THREE.PCFSoftShadowMap // М'які тіні

// Об'єкти
cube.castShadow = true
plane.receiveShadow = true
tiles.forEach(tile => (tile.receiveShadow = true))

// Rendering Loop
const render = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

// Initialize
window.addEventListener('resize', handleResize(camera, renderer))
window.addEventListener('click', handleMouseClick(isCubeAnimating, mouse, raycaster, camera, cube, tiles))
window.addEventListener('mousemove', handleMouseMove(mouse, raycaster, camera, cube, tiles, isCubeAnimating))

// Прив'язка функцій до кнопок
spawnCubeButton.addEventListener('click', spawnCube(scene, tiles))
spawnSphereButton.addEventListener('click', spawnSphere(scene, tiles))
spawnPyramidButton.addEventListener('click', spawnPyramid(scene, tiles))
spawnIcosahedronButton.addEventListener('click', spawnIcosahedron(scene, tiles))

const deleteAllObjects = () => {
  const objectsToRemove: THREE.Object3D<THREE.Object3DEventMap>[] = []

  scene.traverse(object => {
    if (!object.userData.isPersistant) {
      objectsToRemove.push(object)
    }
  })

  scene.remove(...objectsToRemove)
}

function resetScene() {
  deleteAllObjects() // Видаляємо всі об'єкти
  tiles.forEach(tile => (tile.userData.isOccupied = false))
  // createGround(scene) // Переставляємо землю
  // scene.background = new THREE.Color(0x000000) // Скидаємо фон
}

resetSceneButton.addEventListener('click', resetScene)

render()
