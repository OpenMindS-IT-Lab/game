import { capitalize } from 'lodash'
import * as THREE from 'three'
import { showDamageText, Timeout } from '../utils'
import { moveAndFlip, moveLinear } from './animations'
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
  allyTowerType: AllyType
  level: number = 0
  health: number = 0
  damage: number = 0
  speed: number = 0
  height: number
  skillCooldown: number = 0
  casting: Timeout
  upgradeCost: number = 0

  private static geometryMap = {
    [AllyType.WATER]: () => new THREE.SphereGeometry(0.75, 16, 16),
    [AllyType.FIRE]: () => new THREE.OctahedronGeometry(0.9).rotateY(Math.PI / 4),
    [AllyType.EARTH]: () => new THREE.BoxGeometry(1.25, 1.25, 1.25),
    [AllyType.AIR]: () => new THREE.IcosahedronGeometry(0.9, 0),
  }

  private static materialMap = {
    [AllyType.WATER]: { color: 0x4277ff, transparent: true, opacity: 1 },
    [AllyType.FIRE]: { color: 0xff4444, transparent: true, opacity: 1 },
    [AllyType.EARTH]: { color: 0x423333, transparent: true, opacity: 1 },
    [AllyType.AIR]: { color: 0x42ffff, transparent: true, opacity: 1 },
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

  private static calcDamage(level: number) {
    return level / 2 + 0.5 * level
  }

  private static calcSpeed(level: number) {
    return parseFloat((level / 4).toFixed(4))
  }
  private static calcSkillCooldown(level: number) {
    return parseFloat((2000 / level).toFixed(2))
  }

  private calcHealth(level: number) {
    return this.health + (level - 1 || 1) * 10
  }

  updatePrice(priceMap: typeof Ally.priceMap = Ally.priceMap) {
    this.upgradeCost = priceMap[this.allyTowerType][this.level]
  }

  levelUp() {
    this.level += 1
    this.health = this.calcHealth(this.level)
    this.damage = Ally.calcDamage(this.level)
    this.speed = Ally.calcSpeed(this.level)
    this.skillCooldown = Ally.calcSkillCooldown(this.level)
  }

  previewUpgrade() {
    const name = capitalize(this.allyTowerType) + ' Tower'
    const nextLevel = this.level + 1

    return `${name}

      COST: ${this.upgradeCost}
      
      Level: ${this.level} (+1)
      Health: ${this.health} (+${this.calcHealth(nextLevel) - this.health})
      Damage: ${this.damage} (+${Ally.calcDamage(nextLevel) - this.damage})
      Speed: ${this.speed} (+${Ally.calcSpeed(nextLevel) - this.speed})
      SkillCooldown: ${this.skillCooldown} (${Ally.calcSkillCooldown(nextLevel) - this.skillCooldown})
    `
  }

  static previewUpgrade(type: AllyType, level?: number) {
    const name = capitalize(type) + ' Tower'
    const nextLevel = level || 1

    return `${name}

      COST: ${this.priceMap[type][level || 0]}
      
      Level: ${1}
      Health: ${10}
      Damage: ${Ally.calcDamage(nextLevel)}
      Speed: ${Ally.calcSpeed(nextLevel)}
      SkillCooldown: ${Ally.calcSkillCooldown(nextLevel)}
      `
  }

  constructor(type: AllyType) {
    const geometry = Ally.geometryMap[type]()
    const material = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.7, ...Ally.materialMap[type] })

    super(geometry, material)

    this.allyTowerType = type
    this.height = Ally.heightMap[this.allyTowerType]

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
      skillCooldown: this.skillCooldown,
    }

    scene.add(this)
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
          }, this.skillCooldown * (i + 1))
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

    this.casting = setInterval(() => skill(enemies), this.skillCooldown)
  }

  public stopCasting() {
    clearInterval(this.casting)
    this.casting = 0
  }
}
