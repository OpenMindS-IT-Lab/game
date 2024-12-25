import * as THREE from 'three'
import { spawnAirTower, spawnEarthTower, spawnFireTower, spawnWaterTower } from './canvas/allies'
import { AnimationHandler, flickerLight } from './canvas/animations'
import { resetCamera } from './canvas/camera'
import { spawnCube, spawnIcosahedron, spawnOctahedron, spawnRandomEnemy, spawnSphere } from './canvas/enemies'
import createGround from './canvas/ground'
import {
  createAmbientLight,
  createDirectionalLight,
  createHemisphereLight,
  createPointLight,
  createSpotLight,
} from './canvas/light'
import renderer, { render } from './canvas/renderer'
import createTiles from './canvas/tiles'
import createTower, { shootAtNearestEnemy } from './canvas/tower'
import { enableCameraDrag, enableMouseWheelTilt, resetScene } from './canvas/utils'
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
resetCamera()

gameContainer.appendChild(renderer.domElement)

enableCameraDrag()
enableMouseWheelTilt()

// Ground and Grid
const { gridHelper: _gridHelper, plane } = createGround()

// Tiles
const tiles: THREE.Mesh[] = createTiles(2)

// Tower
const tower = createTower(1.25)

// Raycaster
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Lighting
createAmbientLight()
createDirectionalLight()
const spotLight = createSpotLight(tower)
const { lightSphere: _lightSphere, pointLight } = createPointLight()
createHemisphereLight()
flickerLight(pointLight)

// Animation Handlers
const isTowerAnimating = new AnimationHandler(false)

renderer.shadowMap.enabled = true // Увімкнення тіней на рівні рендера
renderer.shadowMap.type = THREE.PCFSoftShadowMap // М'які тіні

// Об'єкти
tower.castShadow = true
plane.receiveShadow = true
tiles.forEach(tile => (tile.receiveShadow = true))

setInterval(() => spawnRandomEnemy(), 2500)
setInterval(() => shootAtNearestEnemy(tower), 2000)

// Initialize
window.addEventListener('resize', handleResize(renderer))
window.addEventListener('click', handleMouseClick(isTowerAnimating, mouse, raycaster, tower, spotLight))
window.addEventListener('mousemove', handleMouseMove(mouse, raycaster, tower, isTowerAnimating))

// Прив'язка функцій до кнопок
spawnCubeButton.addEventListener('click', () => spawnCube())
spawnSphereButton.addEventListener('click', () => spawnSphere())
spawnOctahedronButton.addEventListener('click', () => spawnOctahedron())
spawnIcosahedronButton.addEventListener('click', () => spawnIcosahedron())

spawnWaterTowerButton.addEventListener('click', spawnWaterTower)
spawnFireTowerButton.addEventListener('click', spawnFireTower)
spawnEarthTowerButton.addEventListener('click', spawnEarthTower)
spawnAirTowerButton.addEventListener('click', spawnAirTower)

resetSceneButton.addEventListener('click', resetScene)

render()
