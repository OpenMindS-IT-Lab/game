import * as THREE from 'three'
import { AnimationHandler, flickerLight } from './canvas/animations'
import { resetCamera } from './canvas/camera'
import EnemySpawner from './canvas/enemies'
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
import Tower from './canvas/tower'
import { enableCameraDrag, enableMouseWheelTilt, resetScene } from './canvas/utils'
import Game from './game'
import './ui'
import {
  resetSceneButton,
  spawnAirTowerButton,
  spawnEarthTowerButton,
  spawnFastButton,
  spawnFatButton,
  spawnFireTowerButton,
  spawnRegularButton,
  spawnStrongButton,
  spawnWaterTowerButton,
} from './ui'
import { handleMouseClick, handleMouseMove, handleResize } from './ui/event-listeners'
import renderInfoTable from './ui/info-table'

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
const tower = new Tower(1.25)

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

const spawner = new EnemySpawner()
const game = new Game(spawner, tower)
game.start()

// Call updateGameInfoTable periodically to refresh the data
renderInfoTable(tower, spawner)

// Initialize
window.addEventListener('resize', handleResize(renderer))
window.addEventListener(
  'click',
  handleMouseClick(isTowerAnimating, mouse, raycaster, tower, spawner.enemies, spotLight)
)
window.addEventListener('mousemove', handleMouseMove(mouse, raycaster, tower, spawner.enemies, isTowerAnimating))

// Прив'язка функцій до кнопок
spawnFatButton.addEventListener('click', () => spawner.spawnFat())
spawnFastButton.addEventListener('click', () => spawner.spawnFast())
spawnRegularButton.addEventListener('click', () => spawner.spawnRegular())
spawnStrongButton.addEventListener('click', () => spawner.spawnStrong())

spawnWaterTowerButton.addEventListener('click', () => tower.spawnWaterTower())
spawnFireTowerButton.addEventListener('click', () => {
  const fireTower = tower.spawnFireTower()
  fireTower.startCasting(spawner.enemies)
})
spawnEarthTowerButton.addEventListener('click', () => tower.spawnEarthTower())
spawnAirTowerButton.addEventListener('click', () => tower.spawnAirTower())

resetSceneButton.addEventListener('click', resetScene)

render()
