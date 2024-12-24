import * as THREE from 'three'
import { resetScene, spawnAirTower, spawnEarthTower, spawnFireTower, spawnWaterTower } from './canvas/allies'
import { AnimationHandler, flickerLight } from './canvas/animations'
import { spawnCube, spawnIcosahedron, spawnOctahedron, spawnRandomEnemy, spawnSphere } from './canvas/enemies'
import createGround from './canvas/ground'
import {
  createAmbienLight,
  createDirectionalLight,
  createHemisphereLight,
  createPointLight,
  createSpotLight,
} from './canvas/light'
import createTiles from './canvas/tiles'
import createTower, { shootAtNearestEnemy } from './canvas/tower'
import { enableCameraDrag, enableMouseWheelTilt } from './canvas/utils'
import './ui'
import {
  resetSceneButton,
  spawnAirTowerButton,
  spawnCubeButton,
  spawnEarthTowerButton,
  spawnFireTowerButton,
  spawnIcosahedronButton,
  spawnOctahedronButton,
  spawnSphereButton,
  spawnWaterTowerButton,
} from './ui'
import { handleMouseClick, handleMouseMove, handleResize } from './ui/event-listeners'

// Setup Game Container
const gameContainer = document.getElementById('game-container')
if (!gameContainer) throw new Error('Game container not found')

// Scene, Camera, Renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.lookAt(0, 0, 0)
camera.position.set(0, 14, 18)
camera.rotation.set(-0.9, 0, 0)
camera.userData = { isPersistant: true }

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
gameContainer.appendChild(renderer.domElement)

const cameraDragHandler = enableCameraDrag(camera, renderer)
const wheelTiltHandler = enableMouseWheelTilt(camera, renderer)

// Ground and Grid
const { gridHelper, plane } = createGround(scene)

// Tiles
const tiles: THREE.Mesh[] = createTiles(scene, 2)

// Cube
const tower = createTower(scene, 1.25)

// Raycaster
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Lighting
const ambientLight = createAmbienLight(scene)
const directionalLight = createDirectionalLight(scene)
const spotLight = createSpotLight(scene, tower)
const { lightSphere, pointLight } = createPointLight(scene)
const hemisphereLight = createHemisphereLight(scene)
flickerLight(pointLight)

// Animation Handlers
const isCubeAnimating = new AnimationHandler(false)

renderer.shadowMap.enabled = true // Увімкнення тіней на рівні рендера
renderer.shadowMap.type = THREE.PCFSoftShadowMap // М'які тіні

// Об'єкти
tower.castShadow = true
plane.receiveShadow = true
tiles.forEach(tile => (tile.receiveShadow = true))

setInterval(() => spawnRandomEnemy(scene), 2500)
setInterval(() => shootAtNearestEnemy(tower, scene), 2000)
// moveEnemiesTowardTower(tower, scene)

// function animate() {
//   requestAnimationFrame(animate)

//   // Рух ворогів

//   renderer.render(scene, camera)
// }
// animate()

// Rendering Loop
const render = () => {
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

// Initialize
window.addEventListener('resize', handleResize(camera, renderer))
window.addEventListener('click', handleMouseClick(isCubeAnimating, mouse, raycaster, camera, tower, spotLight))
window.addEventListener('mousemove', handleMouseMove(mouse, raycaster, camera, tower, isCubeAnimating))

// Прив'язка функцій до кнопок
spawnCubeButton.addEventListener('click', () => spawnCube(scene))
spawnSphereButton.addEventListener('click', () => spawnSphere(scene))
spawnOctahedronButton.addEventListener('click', () => spawnOctahedron(scene))
spawnIcosahedronButton.addEventListener('click', () => spawnIcosahedron(scene))

spawnWaterTowerButton.addEventListener('click', spawnWaterTower(scene))
spawnFireTowerButton.addEventListener('click', spawnFireTower(scene))
spawnEarthTowerButton.addEventListener('click', spawnEarthTower(scene))
spawnAirTowerButton.addEventListener('click', spawnAirTower(scene))

resetSceneButton.addEventListener('click', resetScene(scene, camera))

window.addEventListener(
  'keydown',
  event => {
    if (event.code === 'Space') {
      const enemy = findNearestEnemy(tower)

      if (enemy) {
        shootAtEnemy(tower, enemy, scene)
      }
    }
  },
  { passive: true }
)

render()
