import * as THREE from 'three'
import { flickerLight } from './canvas/animations'
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
import Game from './game'
import './ui'
import { shop, startLevelButton, toggleShop } from './ui/bottom-menu'
import {
  handleDoubleClick,
  handleMouseMove,
  handlePointerEvent,
  handleResize,
} from './ui/event-handlers'
// import { enableOrbitControls } from './utils';
// import { enableCameraDrag, enableMouseWheelTilt } from './utils'

// enableCameraDrag()
// enableMouseWheelTilt()
// enableOrbitControls()

// Ground and Grid
const { gridHelper, plane } = createGround(renderer)

// Tiles
createTiles(2)

// Tower
const tower = new Tower(2)

// Raycaster
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

window.addEventListener('click', handlePointerEvent(pointer, raycaster, tower))
window.addEventListener(
  'touchstart',
  handlePointerEvent(pointer, raycaster, tower)
)
window.addEventListener(
  'dblclick',
  handleDoubleClick(pointer, raycaster, tower, gridHelper, plane)
)
window.addEventListener('mousemove', handleMouseMove(pointer, raycaster, tower))

// Lighting
createAmbientLight()
createDirectionalLight()
createSpotLight(tower)
const { lightSphere: _lightSphere, pointLight } = createPointLight()
createHemisphereLight()
const { pause: pauseLightFlickering, resume: resumeLightFlickering } =
  flickerLight(pointLight)

// Об'єкти
plane.receiveShadow = true
// tiles.forEach(tile => (tile.receiveShadow = true))

const spawner = new EnemySpawner()
const game = new Game(spawner, tower)
game.onLevelStart = resumeLightFlickering
game.onLevelComplete = pauseLightFlickering

// Call updateGameInfoTable periodically to refresh the data
// renderInfoTable(tower, spawner)

// Initialize
window.addEventListener('resize', handleResize(renderer))

startLevelButton.addEventListener('click', () => {
  game.start()
  resumeLightFlickering()
  if (!shop.classList.contains('hidden')) toggleShop()
})

render()
