import * as THREE from 'three'
import { Ally, AllyType } from './canvas/allies'
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
import {
  startLevelButton,
  upgradeAirTowerButton,
  upgradeEarthTowerButton,
  upgradeFireTowerButton,
  upgradeMainTowerButton,
  upgradeWaterTowerButton,
} from './ui'
import { handleResize } from './ui/event-listeners'
// import { enableCameraDrag, enableMouseWheelTilt } from './utils'

try {
  Telegram.WebApp.ready()
  if (!Telegram.WebApp.isFullscreen) Telegram.WebApp.requestFullscreen()
} catch (error) {
  console.error(error)
}

// enableCameraDrag()
// enableMouseWheelTilt()

// Ground and Grid
const { gridHelper: _gridHelper, plane } = createGround()

// Tiles
const tiles = createTiles(2)

// Tower
const tower = new Tower(1.25)

// Raycaster
// const raycaster = new THREE.Raycaster()
// const mouse = new THREE.Vector2()

// Lighting
createAmbientLight()
createDirectionalLight()
createSpotLight(tower)
const { lightSphere: _lightSphere, pointLight } = createPointLight()
createHemisphereLight()
flickerLight(pointLight)

// Animation Handlers
// const isTowerAnimating = new AnimationHandler(false)

renderer.shadowMap.enabled = true // Увімкнення тіней на рівні рендера
renderer.shadowMap.type = THREE.PCFSoftShadowMap // М'які тіні

// Об'єкти
tower.castShadow = true
plane.receiveShadow = true
tiles.forEach(tile => (tile.receiveShadow = true))

const spawner = new EnemySpawner()
const game = new Game(spawner, tower)
game.initStorage()
// game.start()

// Call updateGameInfoTable periodically to refresh the data
// renderInfoTable(tower, spawner)

// Initialize
window.addEventListener('resize', handleResize(renderer))
// window.addEventListener(
//   'click',
//   handleMouseClick(isTowerAnimating, mouse, raycaster, tower, spawner.enemies, spotLight)
// )
// window.addEventListener('mousemove', handleMouseMove(mouse, raycaster, tower, spawner.enemies, isTowerAnimating))

// Прив'язка функцій до кнопок
// spawnFatButton.addEventListener('click', () => spawner.spawnFat())
// spawnFastButton.addEventListener('click', () => spawner.spawnFast())
// spawnRegularButton.addEventListener('click', () => spawner.spawnRegular())
// spawnStrongButton.addEventListener('click', () => spawner.spawnStrong())

const updateMainTowerButtonTooltip = () => upgradeMainTowerButton.setAttribute('data-title', tower.previewUpgrade())
upgradeMainTowerButton.addEventListener('click', () => {
  game.levelUp(tower)

  updateMainTowerButtonTooltip()
})
upgradeMainTowerButton.addEventListener('mouseover', () => {
  updateMainTowerButtonTooltip()
})

const updateWaterTowerButtonTooltip = () =>
  upgradeWaterTowerButton.setAttribute(
    'data-title',
    tower.allies[AllyType.WATER]
      ? tower.allies[AllyType.WATER].previewUpgrade()
      : Ally.previewUpgrade(AllyType.WATER, 0)
  )
upgradeWaterTowerButton.addEventListener('click', () => {
  let waterTower = tower.allies[AllyType.WATER]
  if (!waterTower) {
    waterTower = game.purchase(AllyType.WATER)
    waterTower.startCasting(spawner.enemies)
  } else game.levelUp(waterTower)

  updateWaterTowerButtonTooltip()
})
upgradeWaterTowerButton.addEventListener('mouseover', () => {
  updateWaterTowerButtonTooltip()
})

const updateFireTowerButtonTooltip = () =>
  upgradeFireTowerButton.setAttribute(
    'data-title',
    tower.allies[AllyType.FIRE] ? tower.allies[AllyType.FIRE].previewUpgrade() : Ally.previewUpgrade(AllyType.FIRE, 0)
  )
upgradeFireTowerButton.addEventListener('click', () => {
  let fireTower = tower.allies[AllyType.FIRE]
  if (!fireTower) {
    fireTower = game.purchase(AllyType.FIRE)
    fireTower.startCasting(spawner.enemies)
  } else game.levelUp(fireTower)
  updateFireTowerButtonTooltip()
})
upgradeFireTowerButton.addEventListener('mouseover', () => {
  updateFireTowerButtonTooltip()
})

const updateEarthTowerButtonTooltip = () =>
  upgradeEarthTowerButton.setAttribute(
    'data-title',
    tower.allies[AllyType.EARTH]
      ? tower.allies[AllyType.EARTH].previewUpgrade()
      : Ally.previewUpgrade(AllyType.EARTH, 0)
  )
upgradeEarthTowerButton.addEventListener('click', () => {
  let earthTower = tower.allies[AllyType.EARTH]
  if (!earthTower) {
    earthTower = game.purchase(AllyType.EARTH)
    earthTower.startCasting(spawner.enemies)
  } else game.levelUp(earthTower)
  updateEarthTowerButtonTooltip()
})
upgradeEarthTowerButton.addEventListener('mouseover', () => {
  updateEarthTowerButtonTooltip()
})

const updateAirTowerButtonTooltip = () =>
  upgradeAirTowerButton.setAttribute(
    'data-title',
    tower.allies[AllyType.AIR] ? tower.allies[AllyType.AIR].previewUpgrade() : Ally.previewUpgrade(AllyType.AIR, 0)
  )
upgradeAirTowerButton.addEventListener('click', () => {
  let airTower = tower.allies[AllyType.AIR]
  if (!airTower) {
    airTower = game.purchase(AllyType.AIR)
    airTower.startCasting(spawner.enemies)
  } else game.levelUp(airTower)
  updateAirTowerButtonTooltip()
})
upgradeAirTowerButton.addEventListener('mouseover', () => {
  updateAirTowerButtonTooltip()
})

startLevelButton.addEventListener('click', () => game.start())

// pauseButton.addEventListener('click', () => {
//   game.pause()
// })
// resumeButton.addEventListener('click', () => {
//   game.resume()
// })

render()
