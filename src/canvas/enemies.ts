import { pull, remove, without } from 'lodash'
import * as THREE from 'three'
import { AllyType } from './allies'
import { Colors } from './constants'
import { scene } from './scene'
import { tiles } from './tiles'
import Tower from './tower'
import { checkCollisionsAll, showDamageText } from './utils'

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
  moving: number
  watchingCollisions: number

  protected spawner: EnemySpawner

  private statsMap = {
    [EnemyType.REGULAR]: { health: 1, damage: 1, speed: 0.05, height: 1.9 },
    [EnemyType.FAST]: { health: 1, damage: 1, speed: 0.1, height: 1.6 },
    [EnemyType.FAT]: { health: 2, damage: 1, speed: 0.05, height: 1.3 },
    [EnemyType.STRONG]: { health: 1, damage: 2, speed: 0.05, height: 1.6 },
  }

  constructor(type: EnemyType = EnemyType.REGULAR, level: number, spawner: EnemySpawner) {
    const geometry = geometryMap[type]()
    const material = new THREE.MeshStandardMaterial({
      ...getRandomColor(),
      metalness: 0.3,
      roughness: 0.7,
    })

    super(geometry, material)

    this.enemyType = type
    const baseStats = this.statsMap[this.enemyType]
    const { health, damage, height, speed } = baseStats

    this.level = level
    this.health = health * this.level
    this.damage = this.level / 2 + damage - 0.5
    this.speed = parseFloat((speed * (0.75 + this.level / 4)).toFixed(5))
    this.height = height / 2 - 0.05
    this.moving = 0
    this.watchingCollisions = 0
    this.spawner = spawner

    let randomPosition
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        randomPosition = getRandomPosition()
        this.position.copy(randomPosition).setY(this.height)
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
    const spawnPosition = this.position.clone()
    const towerPosition =
      scene.children.find(child => child.name === 'Tower')?.position.clone() ??
      new THREE.Vector3(0, spawnPosition.y, 14)
    const direction = new THREE.Vector3().subVectors(towerPosition, spawnPosition).setY(spawnPosition.y).normalize()

    this.lookAt(towerPosition)

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

    return this.moving
  }

  public watchCollisions() {
    this.watchingCollisions = setInterval(() => {
      const collisions = checkCollisionsAll(this)

      if (collisions.length > 0) {
        // Видаляємо ворога та снаряд

        for (let collision of collisions) {
          if ('projectile' in collision.userData && collision.userData.projectile) {
            this.takeDamage(collision.userData.damage)
            scene.remove(collision)
          }

          if (collision.name === 'Tower') {
            const tower = scene.getObjectByName('Tower') as Tower

            if (!tower) throw new Error('Smth went wrong with Tower when handling collision!')

            tower.takeDamage(this.damage, this.spawner)
            this.destroy()
          }
        }

        this.spawner.purgeDestroyedEnemies()
      }
    }, 1000 / 60) // 60 FPS

    return this.watchingCollisions
  }

  public takeDamage(damage: number, type?: AllyType) {
    const colorMap = {
      [AllyType.WATER]: 0x4277ff,
      [AllyType.FIRE]: 0xff4444,
      [AllyType.EARTH]: 0x423333,
      [AllyType.AIR]: 0x42ffff,
    }
    showDamageText(damage, this.position.clone(), !!type ? colorMap[type] : 0xffffff)

    this.health -= damage

    if (this.health <= 0) {
      this.destroy()
    }
  }

  public destroy() {
    this.spawner.clearInterval(this.moving)
    this.spawner.clearInterval(this.watchingCollisions)

    this.userData.isDestroyed = true
    scene.remove(this)

    // pull(this.spawner.enemies, this)
    // this.spawner.purgeDestroyedEnemies()
    // remove(this.spawner.enemies, ({ userData }) => userData.isDestroyed)
  }
}

// Функція для створення геометрії
export default class EnemySpawner {
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
    this.spawnRate = (1 / this.level) * 3000

    this.spawnEnemy = this.spawnEnemy.bind(this)
  }

  spawnEnemy(type?: EnemyType) {
    const newEnemy = new Enemy(type, this.level, this)

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
    console.log('Spawning random enemy')
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

  private _intervals = [] as number[]

  get intervals() {
    return this._intervals
  }

  set intervals(entrries: number[]) {
    this._intervals = entrries
  }

  private startI = 0
  private levelUpI = 0

  public clearInterval(interval: number) {
    clearInterval(interval)
    pull(this.intervals, interval)
  }

  public start() {
    this.startI = setInterval(() => this.spawnRandomEnemy(), this.spawnRate)
    this.levelUpI = setInterval(() => {
      this.level += 1
      this.update()
    }, 30000)
    this.intervals.push(this.startI, this.levelUpI)
  }

  public stop() {
    // console.log('stop() called')

    // console.log('Interating throught ' + this.enemies.length + ' enemies')
    this.enemies.forEach(enemy => {
      // console.log(enemy)
      enemy.destroy()
      // console.log('destroy() called')
    })
    // console.log('After iterationg the list of enemies is: ' + this.enemies)
    this.purgeDestroyedEnemies()
    // console.log('purgeDestroyedEnemies() called')
    // console.log('Enemies: ', this.enemies)

    this.intervals.forEach(interval => clearInterval(interval))

    this.intervals = []
  }

  private update() {
    clearInterval(this.startI)
    this.intervals = without(this.intervals, this.startI)
    this.spawnRate = (1 / this.level) * 3000
    this.startI = setInterval(() => this.spawnRandomEnemy(), this.spawnRate)
    this.intervals.push(this.startI)
  }
}
