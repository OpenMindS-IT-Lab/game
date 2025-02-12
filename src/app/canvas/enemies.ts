import { compact, entries, minBy, pull, remove, without } from 'lodash'
import * as THREE from 'three'
import Game from '../game'
import { checkCollisionsAll, float, showDamageText, Timeout } from '../utils'
import { Ally, AllyType } from './allies'
import { AnimationHandler, moveLinear } from './animations'
import { Colors } from './constants'
import { scene } from './scene'
import { tiles } from './tiles'
import Tower, { Projectile } from './tower'

// Функція для створення випадкового кольору
function getRandomColor() {
  return { ...Colors.ENEMY, color: new THREE.Color(Math.random() * 0xffffff) }
}

// Функція для випадкового розташування
function getRandomPosition() {
  let targetTile

  const getRandomFreeTile = () => {
    let freeTiles = tiles.filter(tile => !tile.userData.isOccupied && tile.position.z === -14)
    let randomIndex = Math.floor(Math.random() * freeTiles.length)

    if (freeTiles.length === 0) {
      throw new Error("Can't spawn new enemy! All tiles are occupied!")
    }

    return freeTiles[randomIndex]
  }

  do {
    targetTile = getRandomFreeTile()
  } while (!targetTile)

  targetTile.userData.isOccupied = true

  return {
    x: targetTile.position.x,
    y: 0,
    z: targetTile.position.z,
  }
}

const enum EnemyType {
  REGULAR = 'regular',
  FAST = 'fast',
  FAT = 'fat',
  STRONG = 'strong',
}

const geometryMap = {
  [EnemyType.FAT]: () => new THREE.BoxGeometry(1.25, 1.25, 1.25),
  [EnemyType.FAST]: () => new THREE.SphereGeometry(0.75, 16, 16),
  [EnemyType.REGULAR]: () => new THREE.OctahedronGeometry(0.9).rotateY(Math.PI / 4),
  [EnemyType.STRONG]: () => new THREE.IcosahedronGeometry(0.9, 0),
}

export class Enemy extends THREE.Mesh {
  enemyType: EnemyType
  level: number
  health: number
  damage: number
  speed: number
  height: number
  moving: Timeout
  watchingCollisions: Timeout
  coinDropRange: [number, number]
  score: number
  spawnPostion: THREE.Vector3
  spawner: EnemySpawner

  private statsMap = {
    [EnemyType.REGULAR]: { health: 1, damage: 1, speed: 0.05, height: 1.9 * 0.75, coinDropRange: [0, 1] },
    [EnemyType.FAST]: { health: 1, damage: 1, speed: 0.1, height: 1.6 * 0.75, coinDropRange: [0, 2] },
    [EnemyType.FAT]: { health: 2, damage: 1, speed: 0.05, height: 1.3 * 0.75, coinDropRange: [0, 3] },
    [EnemyType.STRONG]: { health: 1, damage: 2, speed: 0.05, height: 1.6 * 0.75, coinDropRange: [0, 2] },
  }

  constructor(type: EnemyType = EnemyType.REGULAR, spawner: EnemySpawner) {
    const geometry = geometryMap[type]().scale(0.75, 0.75, 0.75)
    const material = new THREE.MeshStandardMaterial({
      ...getRandomColor(),
      metalness: 0.1,
      roughness: 0.7,
    })

    super(geometry, material)

    this.enemyType = type
    const baseStats = this.statsMap[this.enemyType]
    const {
      health,
      damage,
      height,
      speed,
      coinDropRange: [minCoinDrop, maxCoinDrop],
    } = baseStats

    this.level = spawner.level
    this.health = health * this.level + (this.level > 4 ? this.level % 4 : 0)
    this.damage = Math.ceil((this.level / 2) * damage + 0.5)
    this.speed = float(speed * (0.875 + this.level / 8))
    this.height = height / 2 - 0.05
    this.moving = 0
    this.watchingCollisions = 0
    this.spawner = spawner
    this.coinDropRange = [
      minCoinDrop + this.level - 1,
      Math.ceil(maxCoinDrop * (this.level % 2 ? this.level : this.level / 2)),
    ]
    this.score = Math.floor(
      (this.level * (1 / this.speed) * (this.health / this.level) * (this.damage / (this.level / 2))) / 14
    )
    this.spawnPostion = this.position.clone().setY(this.height)

    let randomPosition
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        randomPosition = getRandomPosition()
        this.position.copy(randomPosition).setY(this.height)
        this.spawnPostion = this.position.clone()
        break
      } catch (error) {
        attempts++
        if (attempts >= maxAttempts) {
          console.error('Failed to generate position after multiple attempts:', error)
        }
      }
    }

    this.castShadow = true
    this.receiveShadow = true
    this.userData = {
      isPersistant: false,
      isSelected: false,
      isAnimating: new AnimationHandler(false),
      boundingBox: new THREE.Box3(),
      initialColor: Colors.ENEMY,
      isDestroyed: false,
      health: this.health,
      damage: this.damage,
      speed: this.speed,
      type,
    }

    scene.add(this)
  }

  public move() {
    const spawnPosition = this.spawnPostion
    const tower = scene.children.find(child => child.name === 'Tower') as Tower

    const towerPosition = tower.position.clone()
    const alliesPositions = compact(entries(tower.allies).map(([, ally]) => (ally ? ally.position.clone() : null)))
    const defaultDirectionSubVector = new THREE.Vector3(spawnPosition.x, spawnPosition.y, 14)
    const nearestAllyPosition =
      minBy([...alliesPositions, towerPosition], position => this.position.distanceTo(position)) ??
      defaultDirectionSubVector
    const direction = this.spawnPostion
      .clone()
      .subVectors(nearestAllyPosition, this.position.clone())
      .setY(spawnPosition.y)
      .normalize()

    this.lookAt(nearestAllyPosition)

    const fieldTiles = tiles.filter(tile => tile.position.z !== 14)

    this.moving = setInterval(() => {
      this.position.addScaledVector(direction, this.speed).setY(spawnPosition.y)

      // Оновлення статусу плитки
      fieldTiles.forEach(tile => {
        if (tile.position.distanceTo(this.position.clone()) <= 0.05) {
          tile.userData.isOccupied = true
        } else if (tile.userData.isOccupied && tile.position.distanceTo(this.position.clone()) > 1) {
          tile.userData.isOccupied = false
        }
      })
    }, 1000 / 60) // 60 FPS

    this.spawner.purgeDestroyedEnemies()

    return this.moving
  }

  public stop() {
    this.spawner.clearInterval(this.moving)
    this.moving = 0
  }

  public watchCollisions() {
    this.watchingCollisions = setInterval(() => {
      const collisions = checkCollisionsAll(this)

      if (collisions.length > 0) {
        for (let collision of collisions) {
          if (collision instanceof Projectile) {
            this.takeDamage(collision.damage)
            scene.remove(collision)
          }

          if (collision instanceof Tower) {
            const tower = scene.getObjectByName('Tower') as Tower

            if (!tower) throw new Error('Smth went wrong with Tower when handling collision!')

            tower.takeDamage(this.damage, this.spawner)
            this.spawner.addScore(this.score)
            this.dropCoins()
            this.destroy()
          }

          if (collision instanceof Ally) {
            collision.takeDamage(this.damage, this.spawner)
            this.spawner.addScore(this.score)
            this.dropCoins()
            this.destroy()
          }

          if (collision instanceof Enemy) {
            this.stop()

            if (this.position.z >= -12 && collision.position.z >= -12)
              collision.takeDamage(float(0.1 * this.damage), AllyType.WATER, this.spawner.enemies.length > 25)

            const towerPosition = (scene.getObjectByName('Tower') as Tower).position.clone()
            const distanceToTower = this.position.clone().distanceTo(towerPosition)
            const collisionDistanceToTower = collision.position.clone().distanceTo(towerPosition)

            const direction = new THREE.Vector3()
              .subVectors(collision.position.clone(), this.position.clone())
              .multiplyScalar(20)
              .normalize()

            if (distanceToTower > collisionDistanceToTower && !this.moving && !this.userData.isAnimating.currentState) {
              moveLinear(
                this,
                this.position.clone().sub(direction.clone()),
                this.userData.isAnimating,
                () => this.move(),
                2
              )
            } else if (!this.moving && !this.userData.isAnimating.currentState) {
              this.move()
            }
          }
        }

        this.spawner.purgeDestroyedEnemies()
      }
    }, 1000 / 60) // 60 FPS

    return this.watchingCollisions
  }

  public takeDamage(damage: number, type?: AllyType, hideDamageText: boolean = false) {
    const colorMap = {
      [AllyType.WATER]: 0x4277ff,
      [AllyType.FIRE]: 0xff4444,
      [AllyType.EARTH]: 0x423333,
      [AllyType.AIR]: 0x42ffff,
    }

    if (!hideDamageText) showDamageText(damage, this.position.clone(), !!type ? colorMap[type] : 0xffffff)

    this.health -= damage

    if (this.health <= 0) {
      this.spawner.addScore(this.score)
      this.dropCoins()
      this.destroy()
    }
  }

  public destroy() {
    this.spawner.clearInterval(this.moving)
    this.spawner.clearInterval(this.watchingCollisions)

    this.userData.isDestroyed = true
    scene.remove(this)

    // this.spawner.addScore(enemyScore)
    // pull(this.spawner.enemies, this)
    // this.spawner.purgeDestroyedEnemies()
    // remove(this.spawner.enemies, ({ userData }) => userData.isDestroyed)
  }

  private dropCoins() {
    const [minDrop, maxDrop] = this.coinDropRange
    const coinDropDelta = maxDrop - minDrop
    const drop = Math.round(Math.random() * coinDropDelta) + minDrop

    this.spawner.collectDrop(drop)
  }
}

// Функція для створення геометрії
export default class EnemySpawner {
  __game?: Game

  private _enemies: Enemy[] = []
  public get enemies() {
    return this._enemies
  }
  set enemies(enemies: Enemy[]) {
    this._enemies = enemies
  }

  level: number
  spawnRate: number

  constructor() {
    this.enemies = []
    this.intervals = []
    this.level = 1
    this.spawnRate = (1 / (this.level * 2 - 1)) * 3000

    this.spawnEnemy = this.spawnEnemy.bind(this)
  }

  public collectDrop(coins: number) {
    this.__game!.coins += coins
  }

  public addScore(score: number) {
    this.__game!.score += score
  }

  spawnEnemy(type?: EnemyType) {
    const _spawner = this
    const newEnemy = new Enemy(type, _spawner)

    this.enemies.push(newEnemy)

    newEnemy.move()
    newEnemy.watchCollisions()

    this.intervals.push(newEnemy.moving, newEnemy.watchingCollisions)

    return newEnemy
  }

  purgeDestroyedEnemies() {
    // this.enemies.sort(({ userData: { isDestroyed: a } }) => a)
    // this.enemies.splice(0, this.enemies.length, ...this.enemies.filter(enemy => !enemy.userData.isDestroyed))
    remove(this.enemies, ({ userData }) => userData.isDestroyed)
  }

  // Індивідуальні функції для кожного типу геометрії
  // FAT ENEMY
  spawnFat() {
    return this.spawnEnemy(EnemyType.FAT)
  }

  // FAST ENEMY
  spawnFast() {
    return this.spawnEnemy(EnemyType.FAST)
  }

  // REGULAR ENEMY
  spawnRegular() {
    return this.spawnEnemy()
  }

  // STRONG ENEMY
  spawnStrong() {
    return this.spawnEnemy(EnemyType.STRONG)
  }

  spawnRandomEnemy() {
    // console.log('Spawning random enemy')
    const _spawner = this

    const EnemiesMap = {
      0: this.spawnFat.bind(_spawner),
      1: this.spawnFast.bind(_spawner),
      2: this.spawnStrong.bind(_spawner),
      3: this.spawnRegular.bind(_spawner),
    }

    const randomEnemy = EnemiesMap[Math.floor(Math.random() * 4) as keyof typeof EnemiesMap]()

    if (!randomEnemy) throw new Error('Failed to spawn new enemy!')

    return randomEnemy
  }

  private _intervals = [] as Timeout[]

  get intervals(): Timeout[] {
    return this._intervals
  }

  set intervals(entrries: Timeout[]) {
    this._intervals = entrries
  }

  private startI = 0 as Timeout

  public clearInterval(interval: Timeout) {
    clearInterval(interval)
    pull(this.intervals, interval)
  }

  private updateSpawnRate() {
    const dividend = 3000
    const divisor = this.level / 2 <= 1 ? 1 : this.level / 2
    const quotient = dividend / divisor

    this.spawnRate = Math.round(quotient)
  }

  public start(level: number) {
    this.level = level
    this.updateSpawnRate()
    this.startI = setInterval(() => this.spawnRandomEnemy(), this.spawnRate)

    // console.log(this.spawnRate)

    // this.levelUpI = setInterval(() => {
    //   this.level += 1
    //   this.update()
    // }, 30000)

    this.intervals.push(this.startI)
  }

  public stop() {
    this.clearInterval(this.startI)
    this.intervals = without(this.intervals, this.startI)
    this.startI = 0
  }

  public pause() {
    this.enemies.forEach(enemy => enemy.stop())
    this.clearInterval(this.startI)
    this.startI = 0
  }

  public resume() {
    this.enemies.forEach(enemy => enemy.move())
    this.update()
  }

  private update() {
    clearInterval(this.startI)
    this.intervals = without(this.intervals, this.startI)
    this.spawnRate = 3000 / (this.level / 2)
    this.startI = setInterval(() => this.spawnRandomEnemy(), this.spawnRate)
    this.intervals.push(this.startI)
  }
}
