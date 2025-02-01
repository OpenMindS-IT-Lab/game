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
import { startLevelButton, updateBottomButtons } from './ui/bottom-menu'
import { handleDoubleClick, handleMouseMove, handlePointerEvent, handleResize } from './ui/event-listeners'
// import { enableCameraDrag, enableMouseWheelTilt } from './utils'

// enableCameraDrag()
// enableMouseWheelTilt()

// Ground and Grid
const { gridHelper, plane } = createGround(renderer)

// Tiles
const tiles = createTiles(2)

// Tower
const tower = new Tower(1.25)

// Raycaster
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

window.addEventListener('click', handlePointerEvent(pointer, raycaster, tower))
window.addEventListener('touchstart', handlePointerEvent(pointer, raycaster, tower))
window.addEventListener('dblclick', handleDoubleClick(pointer, raycaster, tower, gridHelper, plane))
window.addEventListener('mousemove', handleMouseMove(pointer, raycaster, tower))

// Lighting
createAmbientLight()
createDirectionalLight()
createSpotLight(tower)
const { lightSphere: _lightSphere, pointLight } = createPointLight()
createHemisphereLight()
const { pause: pauseLightFlickering, resume: resumeLightFlickering } = flickerLight(pointLight)

// Animation Handlers
// const isTowerAnimating = new AnimationHandler(false)

// Об'єкти
plane.receiveShadow = true
// tiles.forEach(tile => (tile.receiveShadow = true))

const spawner = new EnemySpawner()
const game = new Game(spawner, tower)
game.validateData()
game.onLevelStart = resumeLightFlickering
game.onLevelComplete = pauseLightFlickering
updateBottomButtons(game)
// game.start()

// Call updateGameInfoTable periodically to refresh the data
// renderInfoTable(tower, spawner)

// Initialize
window.addEventListener('resize', handleResize(renderer))

// Прив'язка функцій до кнопок
// spawnFatButton.addEventListener('click', () => spawner.spawnFat())
// spawnFastButton.addEventListener('click', () => spawner.spawnFast())
// spawnRegularButton.addEventListener('click', () => spawner.spawnRegular())
// spawnStrongButton.addEventListener('click', () => spawner.spawnStrong())

startLevelButton.addEventListener('click', () => {
  game.start()
  const imageURL = renderer.domElement.toDataURL('image/png')
  console.log(imageURL)
  resumeLightFlickering()
})

// pauseButton.addEventListener('click', () => {
//   game.pause()
// })
// resumeButton.addEventListener('click', () => {
//   game.resume()
// })

render()
