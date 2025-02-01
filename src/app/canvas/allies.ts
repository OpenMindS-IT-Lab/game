import { capitalize } from 'lodash'
import * as THREE from 'three'
import airTowerImg from '../assets/air-tower.png'
import earthTowerImg from '../assets/earth-tower.png'
import fireTowerImg from '../assets/fire-tower.png'
import waterTowerImg from '../assets/water-tower.png'
import Game from '../game'
import { toggleTowerInfo } from '../ui/tower-info'
import { showDamageText, Timeout } from '../utils'
import { moveAndFlip, moveLinear } from './animations'
import { Colors } from './constants'
import EnemySpawner, { Enemy } from './enemies'
import { scene } from './scene'
import { tiles } from './tiles'
import Tower from './tower'

export const enum AllyType {
  WATER = 'water',
  FIRE = 'fire',
  EARTH = 'earth',
  AIR = 'air',
}

export class Ally extends THREE.Mesh {
  __game?: Game

  title: string
  description: string
  image: string
  level: number = 0
  health: number = 0
  maxHealth: number = 0
  damage: number = 0
  speed: number = 0
  cooldown: number = 0
  upgradeCost: number = 0

  allyTowerType: AllyType
  isSelected: boolean = false
  height: number
  casting: Timeout

  private static geometryMap = {
    [AllyType.WATER]: () => new THREE.SphereGeometry(0.75, 16, 16),
    [AllyType.FIRE]: () => new THREE.OctahedronGeometry(0.9).rotateY(Math.PI / 4),
    [AllyType.EARTH]: () => new THREE.BoxGeometry(1.25, 1.25, 1.25),
    [AllyType.AIR]: () => new THREE.IcosahedronGeometry(0.9, 0),
  }

  private static materialMap = {
    [AllyType.WATER]: { color: 0x4277ff, transparent: true, opacity: 0.8, roughness: 0.5, metalness: 0.3 },
    [AllyType.FIRE]: { color: 0xff4444, transparent: true, opacity: 1, emissiveIntensity: 0.5 },
    [AllyType.EARTH]: { color: 0x423333, transparent: true, opacity: 1, roughness: 1, metalness: 0 },
    [AllyType.AIR]: { color: 0x42ffff, transparent: true, opacity: 0.7, roughness: 0.2, metalness: 0.5 },
  }

  private static heightMap = {
    [AllyType.WATER]: 1.5,
    [AllyType.FIRE]: 1.8,
    [AllyType.EARTH]: 1.25,
    [AllyType.AIR]: 1.8,
  }

  static priceMap = {
    [AllyType.AIR]: [10, 20, 100, 200, 1000, 2000, 10000, 20000, 50000, 100000, 1000000, 2000000],
    [AllyType.WATER]: [15, 30, 150, 300, 1500, 3000, 15000, 30000, 100000, 200000, 1000000, 2000000],
    [AllyType.EARTH]: [20, 40, 200, 400, 2000, 4000, 20000, 40000, 150000, 300000, 1000000, 2000000],
    [AllyType.FIRE]: [25, 50, 250, 500, 2500, 5000, 25000, 50000, 200000, 400000, 1000000, 2000000],
  }

  static descriptionMap = {
    [AllyType.AIR]:
      'Command the skies with the Air Tower, sending a powerful gust that knocks all enemies back, displacing them. This tower ensures you control the battlefield, disrupting enemy formations with each pulse.',
    [AllyType.WATER]:
      "Freeze your foes in their tracks with the Water Tower, launching chilling blasts that immobilize the nearest enemy. This tower's icy grip ensures no enemy escapes its frosty hold.",
    [AllyType.EARTH]:
      "Invoke the might of the Earth Tower as it hurls the nearest enemy into the air, causing them to crash back down with a force that deals damage. This tower's raw power will shake the very ground beneath your enemies' feet.",
    [AllyType.FIRE]:
      "Set the battlefield ablaze with the Fire Tower, igniting all enemies within range and dealing damage with searing flames. Watch as foes are engulfed in fire, their ranks left smoldering in the tower's wake.",
  }

  static imageMap = {
    [AllyType.WATER]: waterTowerImg,
    [AllyType.FIRE]: fireTowerImg,
    [AllyType.EARTH]: earthTowerImg,
    [AllyType.AIR]: airTowerImg,
  }

  private static getRandomPosition() {
    let targetTile

    const getRandomFreeTile = () => {
      let freeTiles = tiles.filter(tile => !tile.userData.isOccupied && tile.position.z === 14)
      let randomIndex = Math.round(Math.random() * freeTiles.length)

      if (freeTiles.length === 0) {
        throw new Error("Can't spawn new ally! All tiles are occupied!")
      }

      return freeTiles[randomIndex]
    }

    do {
      targetTile = getRandomFreeTile()
    } while (!targetTile)

    targetTile.userData.isOccupied = true

    return targetTile.position.clone().setY(0)
  }

  static calcDamage(level: number) {
    return level / 2 + 0.5 * level
  }

  static calcSpeed(level: number) {
    return parseFloat((level / 4).toFixed(4))
  }
  static calcSkillCooldown(level: number) {
    return parseFloat((2000 / level).toFixed(2))
  }

  static calcHealth(health: number, level: number) {
    return health + (level - 1 || 1) * 10
  }

  constructor(type: AllyType) {
    const geometry = Ally.geometryMap[type]()
    const material = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.7, ...Ally.materialMap[type] })

    super(geometry, material)

    this.title = capitalize(type) + ' Tower'
    this.description = Ally.descriptionMap[type]
    this.image = Ally.imageMap[type]

    this.allyTowerType = type
    this.height = Ally.heightMap[type]

    this.level = 0
    this.levelUp()

    this.casting = 0

    try {
      const position = Ally.getRandomPosition()
      this.position.copy(position).setY(this.height / 2)
    } catch (error) {
      console.error(error)
      return
    }

    this.castShadow = true
    this.receiveShadow = true
    this.userData = {
      isPersistant: false,
      isSelected: false,
      boundingBox: new THREE.Box3(),
      initialColor: material.color,
      damage: this.damage,
      speed: this.speed,
      health: this.health,
      skillCooldown: this.cooldown,
    }

    scene.add(this)
  }

  updatePrice(priceMap: typeof Ally.priceMap = Ally.priceMap) {
    this.upgradeCost = priceMap[this.allyTowerType][this.level]
  }

  levelUp() {
    this.level += 1
    this.health = Ally.calcHealth(this.health, this.level)
    this.maxHealth = this.health
    this.damage = Ally.calcDamage(this.level)
    this.speed = Ally.calcSpeed(this.level)
    this.cooldown = Ally.calcSkillCooldown(this.level)
  }

  previewUpgrade() {
    const level = this.level + 1
    const health = Ally.calcHealth(this.health, this.level + 1)
    const damage = Ally.calcDamage(this.level + 1)
    const speed = Ally.calcSpeed(this.level + 1)
    const cooldown = Ally.calcSkillCooldown(this.level + 1)

    return {
      level,
      health,
      damage,
      speed,
      cooldown,
    }
  }

  select() {
    const tower = scene.getObjectByName('Tower') as Tower
    // if (tower.isSelected) tower.unselect()
    tower.unselectAllies()
    tower.unselect()
    ;(this.material as THREE.MeshStandardMaterial).color.set(Colors.SELECTED_TOWER.color)
    this.isSelected = true
    toggleTowerInfo(this)
  }

  unselect() {
    ;(this.material as THREE.MeshStandardMaterial).color.set(Ally.materialMap[this.allyTowerType].color)
    this.isSelected = false
    toggleTowerInfo()
  }

  private getNearestEnemy(enemies: Enemy[]) {
    if (!enemies.length) return false

    const towerPosition = this.position.clone()

    const nearestEnemy =
      enemies
        .filter(({ userData: { isAnimating } }) => !isAnimating.currentState)
        .sort(({ position: a }, { position: b }) => a.distanceTo(towerPosition) - b.distanceTo(towerPosition))[0] ??
      null

    if (!nearestEnemy) return false

    nearestEnemy.spawner.purgeDestroyedEnemies()
    return nearestEnemy
  }

  private freeze(enemies: Enemy[]) {
    const nearestEnemy = this.getNearestEnemy(
      enemies.filter(enemy => !enemy.userData.isAnimating.currentState && enemy.moving)
    )

    if (!nearestEnemy) return
    // const waterDamage = this.damage

    nearestEnemy.userData.isAnimating.switchState(true)
    nearestEnemy.stop()

    const freezed = setTimeout(() => {
      if (!nearestEnemy) {
        clearTimeout(freezed)
        return
      }
      // nearestEnemy.takeDamage(waterDamage, this.allyTowerType)
      nearestEnemy.userData.isAnimating.switchState(false)
      nearestEnemy.spawner.purgeDestroyedEnemies()
      nearestEnemy.moving = nearestEnemy.move()
    }, (this.damage / 3) * 1000)
  }

  public takeDamage(damage: number, spawner: EnemySpawner) {
    const tower = scene.getObjectByName('Tower') as Tower
    if (!tower) return

    this.health -= damage
    showDamageText(damage, this.position, 0xff0000)

    if (this.health <= 0) {
      this.stopCasting()
      scene.remove(this)

      const occupiedTile = tiles
        .filter(tile => tile.userData.isOccupied && tile.position.z === 14)
        .find(tile => tile.position.x === this.position.x)
      if (occupiedTile) occupiedTile.userData.isOccupied = false

      spawner.purgeDestroyedEnemies()

      spawner.enemies
        .filter(enemy => !enemy.userData.isDestroyed && !enemy.userData.isAnimating.currentState)
        .forEach(enemy => {
          enemy.stop()
        })

      tower.allies[this.allyTowerType] = undefined

      spawner.enemies
        .filter(enemy => !enemy.userData.isAnimating.currentState && !enemy.userData.isDestroyed && !enemy.moving)
        .forEach(enemy => {
          enemy.moving = enemy.move()
        })
    }
  }

  private burn(enemies: Enemy[]) {
    enemies
      .filter(enemy => !enemy.userData.isDestroyed)
      .forEach(enemy => {
        const fireDamage = this.damage

        enemy.takeDamage(fireDamage, this.allyTowerType)

        for (let i = 0; i <= this.level; i++) {
          setTimeout(() => {
            if (!enemy.userData.isDestroyed)
              enemy.takeDamage(parseFloat((fireDamage / (i + 1)).toFixed(2)), this.allyTowerType, true)
          }, this.cooldown * (i + 1))
        }
      })
  }

  private toss(enemies: Enemy[]) {
    const nearestEnemy = this.getNearestEnemy(enemies)

    if (!nearestEnemy) return
    const earthDamage = this.damage * 3

    nearestEnemy.stop()
    moveAndFlip(nearestEnemy, nearestEnemy.position.clone(), nearestEnemy.userData.isAnimating, undefined, () => {
      nearestEnemy.takeDamage(earthDamage, this.allyTowerType)
      if (nearestEnemy.health >= 0) nearestEnemy.move()
    })
  }

  private throwback(enemies: Enemy[]) {
    enemies
      .filter(
        enemy =>
          !enemy.userData.isAnimating.currentState &&
          !enemy.userData.isDestroyed &&
          enemy.position.z >= -12 &&
          -5 <= enemy.position.x &&
          enemy.position.x <= 5
      )
      .forEach(enemy => {
        enemy.stop()
        enemy.userData.isAnimating.switchState(true)
        const enemyPostion = enemy.position.clone().setZ(enemy.position.z - this.damage / 3)
        moveLinear(
          enemy,
          enemyPostion,
          enemy.userData.isAnimating.switchState,
          () => {
            enemy.move()
          },
          Math.max(1, 3 / this.damage)
        )
      })
  }

  public startCasting(enemies: Enemy[]) {
    const _ally = this
    const skillMap = {
      [AllyType.WATER]: this.freeze.bind(_ally),
      [AllyType.FIRE]: this.burn.bind(_ally),
      [AllyType.EARTH]: this.toss.bind(_ally),
      [AllyType.AIR]: this.throwback.bind(_ally),
    }
    const skill = skillMap[this.allyTowerType]

    if (this.casting) {
      this.stopCasting()
    }

    this.casting = setInterval(() => skill(enemies), this.cooldown)
  }

  public stopCasting() {
    clearInterval(this.casting)
    this.casting = 0
  }
}
