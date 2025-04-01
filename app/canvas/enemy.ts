import { compact, entries, minBy } from 'lodash'
import * as THREE from 'three'
import { checkCollisionsAll, float, showDamageText } from '../utils'
import { Ally, AllyType } from './ally'
import { AnimationHandler, moveLinear } from './animations'
import { Colors } from './constants'
import EnemySpawner from './enemy-spawner'
import { scene } from './scene'
import { tiles } from './tiles'
import Tower, { Projectile } from './tower'

const isDev = process.env.NODE_ENV === 'development'

// Time in ms between animation frame logs
const LOG_THROTTLE_TIME = 1000
const lastLogTime = new Map<string, number>()

function shouldLog(key: string): boolean {
  if (!isDev) return false
  const now = Date.now()
  const last = lastLogTime.get(key) || 0
  if (now - last >= LOG_THROTTLE_TIME) {
    lastLogTime.set(key, now)
    return true
  }
  return false
}

// Функція для створення випадкового кольору
function getRandomColor() {
  return { ...Colors.ENEMY, color: new THREE.Color(Math.random() * 0xffffff) }
}

export const enum EnemyType {
  REGULAR = 'regular',
  FAST = 'fast',
  FAT = 'fat',
  STRONG = 'strong',
}

export class Enemy extends THREE.Mesh {
  enemyType: EnemyType
  level: number
  health: number
  damage: number
  speed: number
  height: number
  moving: AnimationFrame
  watchingCollisions: AnimationFrame
  coinDropRange: [number, number]
  score: number
  spawnPostion: THREE.Vector3
  spawner: EnemySpawner

  private static geometryMap = {
    [EnemyType.FAT]: () => new THREE.BoxGeometry(1.25, 1.25, 1.25),
    [EnemyType.FAST]: () => new THREE.SphereGeometry(0.75, 16, 16),
    [EnemyType.REGULAR]: () =>
      new THREE.OctahedronGeometry(0.9).rotateY(Math.PI / 4),
    [EnemyType.STRONG]: () => new THREE.IcosahedronGeometry(0.9, 0),
  }

  private static statsMap = {
    [EnemyType.REGULAR]: {
      health: 1,
      damage: 1,
      speed: 0.05,
      height: 1.9 * 0.75,
      coinDropRange: [0, 1],
    },
    [EnemyType.FAST]: {
      health: 1,
      damage: 1,
      speed: 0.1,
      height: 1.6 * 0.75,
      coinDropRange: [0, 2],
    },
    [EnemyType.FAT]: {
      health: 2,
      damage: 1,
      speed: 0.05,
      height: 1.3 * 0.75,
      coinDropRange: [0, 3],
    },
    [EnemyType.STRONG]: {
      health: 1,
      damage: 2,
      speed: 0.05,
      height: 1.6 * 0.75,
      coinDropRange: [0, 2],
    },
  }

  private static getRandomFreeTile = () => {
    let freeTiles = tiles.filter(
      tile => !tile.userData.isOccupied && tile.position.z === -14
    )
    let randomIndex = Math.floor(Math.random() * freeTiles.length)

    if (freeTiles.length === 0) {
      throw new Error("Can't spawn new enemy! All tiles are occupied!")
    }

    return freeTiles[randomIndex]
  }

  // Функція для випадкового розташування
  private static getRandomPosition() {
    let targetTile

    do {
      targetTile = Enemy.getRandomFreeTile()
    } while (!targetTile)

    targetTile.userData.isOccupied = true

    return { x: targetTile.position.x, y: 0, z: targetTile.position.z }
  }

  constructor(type: EnemyType = EnemyType.REGULAR, spawner: EnemySpawner) {
    const geometry = Enemy.geometryMap[type]().scale(0.75, 0.75, 0.75)
    const material = new THREE.MeshStandardMaterial({
      ...getRandomColor(),
      metalness: 0.1,
      roughness: 0.7,
    })

    super(geometry, material)

    this.enemyType = type
    const baseStats = Enemy.statsMap[this.enemyType]
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
      (this.level *
        (1 / this.speed) *
        (this.health / this.level) *
        (this.damage / (this.level / 2))) /
        14
    )
    this.spawnPostion = this.position.clone().setY(this.height)

    let randomPosition
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        randomPosition = Enemy.getRandomPosition()
        this.position.copy(randomPosition).setY(this.height)
        this.spawnPostion = this.position.clone()
        break
      } catch (error) {
        attempts++
        if (attempts >= maxAttempts) {
          console.error(
            'Failed to generate position after multiple attempts:',
            error
          )
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
    cancelAnimationFrame(this.moving!)
    const spawnPos = this.spawnPostion
    const tower = scene.children.find(child => child.name === 'Tower') as Tower
    const towerPos = tower.position.clone()
    const alliesPos = compact(
      entries(tower.allies).map(([, ally]) => ally?.position.clone())
    )
    const defaultDir = new THREE.Vector3(spawnPos.x, spawnPos.y, 14)
    const nearestTarget =
      minBy([...alliesPos, towerPos], pos => this.position.distanceTo(pos)) ??
      defaultDir

    if (isDev) {
      console.log(`[Enemy ${this.uuid}] Movement started:`)
      console.log(`- Type: ${this.enemyType}`)
      console.log(`- Current position:`, this.position.clone())
      console.log(`- Nearest target:`, nearestTarget)
    }

    const direction = this.spawnPostion
      .clone()
      .subVectors(nearestTarget, this.position)
      .setY(spawnPos.y)
      .normalize()
    this.lookAt(nearestTarget)
    const fieldTiles = tiles.filter(tile => tile.position.z !== 14)

    let lastPosition = this.position.clone()
    const animate = () => {
      const currentPos = this.position.clone()
      this.position.addScaledVector(direction, this.speed).setY(spawnPos.y)

      // Only log significant position changes and throttle updates
      const moveDistance = currentPos.distanceTo(lastPosition)
      if (shouldLog(`move_${this.uuid}`) && moveDistance > 0.1) {
        lastPosition = currentPos.clone()
        console.log(
          `[Enemy ${this.uuid}] Significant movement:`,
          `Δ=${moveDistance.toFixed(2)}`,
          `pos=${this.position.x.toFixed(1)},${this.position.z.toFixed(1)}`
        )
      }

      fieldTiles.forEach(tile => {
        const dist = tile.position.distanceTo(currentPos)
        if (dist <= 0.05) {
          tile.userData.isOccupied = true
          if (shouldLog(`tile_${this.uuid}_${tile.uuid}`)) {
            console.log(
              `[Enemy ${this.uuid}] Occupied new tile at`,
              tile.position.clone()
            )
          }
        } else if (tile.userData.isOccupied && dist > 1) {
          tile.userData.isOccupied = false
          if (shouldLog(`tile_${this.uuid}_${tile.uuid}`)) {
            console.log(
              `[Enemy ${this.uuid}] Released tile at`,
              tile.position.clone()
            )
          }
        }
      })

      this.moving = requestAnimationFrame(animate)
    }

    animate()
    this.spawner.purgeDestroyedEnemies()
    return this.moving
  }

  public watchCollisions() {
    cancelAnimationFrame(this.watchingCollisions!)
    let lastCollisionState = ''

    const checkCollisions = () => {
      if (this.userData.isDestroyed) {
        isDev &&
          console.log(
            `[Enemy ${this.uuid}] Skipping collision check - enemy already destroyed`
          )
        return
      }

      const collisions = checkCollisionsAll(this)

      if (collisions.length > 0) {
        const towerObj = scene.getObjectByName('Tower') as Tower

        // Prioritize tower collisions first
        const towerCollision = collisions.find(c => c instanceof Tower)
        if (towerCollision && towerObj) {
          isDev && console.log(`[Enemy ${this.uuid}] Tower collision detected:`)
          isDev && console.log(`- Enemy position:`, this.position.clone())
          isDev && console.log(`- Tower position:`, towerObj.position.clone())
          isDev &&
            console.log(`- Enemy destroyed state:`, this.userData.isDestroyed)

          try {
            towerObj.takeDamage(this.damage, this.spawner)
            this.spawner.addScore(this.score)
            this.dropCoins()
            isDev &&
              console.log(
                `[Enemy ${this.uuid}] Destroying enemy after tower collision`
              )
            this.destroy()
            return // Exit early after tower collision
          } catch (error) {
            console.error(
              `[Enemy ${this.uuid}] Error during tower collision:`,
              error
            )
          }
        }

        // Handle other collisions only if not destroyed by tower
        if (!this.userData.isDestroyed) {
          // Create a collision state string to compare against
          const currentState = collisions
            .map(c => `${c.constructor.name}_${c.uuid}`)
            .sort()
            .join('|')

          // Only log if collision state changed and throttled
          if (
            isDev &&
            currentState !== lastCollisionState &&
            shouldLog(`collision_${this.uuid}`)
          ) {
            lastCollisionState = currentState
            console.log(`[Enemy ${this.uuid}] New collisions:`)
            console.log(
              `- Colliding with:`,
              collisions.map(c => ({
                type: c.constructor.name,
                position: `${c.position.x.toFixed(1)},${c.position.z.toFixed(1)}`,
              }))
            )
          }

          collisions.forEach(collision => {
            if (this.userData.isDestroyed) return // Skip if destroyed during iteration

            if (collision instanceof Projectile) {
              isDev &&
                console.log(
                  `[Enemy ${this.uuid}] Hit by projectile with damage:`,
                  collision.damage
                )
              this.takeDamage(collision.damage)
              scene.remove(collision)
            } else if (collision instanceof Ally) {
              isDev &&
                console.log(
                  `[Enemy ${this.uuid}] Collided with ally, dealing damage:`,
                  this.damage
                )
              collision.takeDamage(this.damage, this.spawner)
              this.spawner.addScore(this.score)
              this.dropCoins()
              this.destroy()
            } else if (collision instanceof Enemy) {
              // Only log enemy collisions when they first occur
              if (
                isDev &&
                shouldLog(`enemy_collision_${this.uuid}_${collision.uuid}`)
              ) {
                console.log(
                  `[Enemy ${this.uuid}] New enemy collision resolution:`
                )
                console.log(
                  `- Colliding with enemy at:`,
                  collision.position.clone()
                )
              }

              this.stop()
              if (this.position.z >= -12 && collision.position.z >= -12) {
                isDev &&
                  console.log(
                    `[Enemy ${this.uuid}] Dealing splash damage:`,
                    float(0.1 * this.damage)
                  )
                collision.takeDamage(
                  float(0.1 * this.damage),
                  AllyType.WATER,
                  this.spawner.enemies.length > 25
                )
              }

              const towerPosition = towerObj.position.clone()
              const distToTower = this.position.distanceTo(towerPosition)
              const collisionDistToTower =
                collision.position.distanceTo(towerPosition)
              const moveDir = new THREE.Vector3()
                .subVectors(collision.position, this.position)
                .multiplyScalar(20)
                .normalize()

              if (isDev) {
                console.log(`[Enemy ${this.uuid}] Collision resolution:`)
                console.log(`- Distance to tower:`, distToTower)
                console.log(
                  `- Colliding enemy distance to tower:`,
                  collisionDistToTower
                )
                console.log(`- Movement direction:`, moveDir)
              }

              if (
                distToTower > collisionDistToTower &&
                !this.moving &&
                !this.userData.isAnimating.currentState
              ) {
                isDev &&
                  console.log(`[Enemy ${this.uuid}] Moving away from collision`)
                moveLinear(
                  this,
                  this.position.clone().sub(moveDir),
                  this.userData.isAnimating,
                  () => this.move(),
                  2
                )
              } else if (
                !this.moving &&
                !this.userData.isAnimating.currentState
              ) {
                isDev &&
                  console.log(
                    `[Enemy ${this.uuid}] Resuming movement after collision`
                  )
                this.move()
              }
            }
          })
        }

        this.spawner.purgeDestroyedEnemies()
      }

      if (!this.userData.isDestroyed) {
        this.watchingCollisions = requestAnimationFrame(checkCollisions)
      } else {
        isDev &&
          console.log(
            `[Enemy ${this.uuid}] Stopping collision checks - enemy destroyed`
          )
      }
    }

    checkCollisions()
    return this.watchingCollisions
  }

  public stop() {
    isDev && console.log(`[Enemy ${this.uuid}] Stopping all animations`)
    if (this.moving) {
      cancelAnimationFrame(this.moving)
      this.moving = null
    }
    if (this.watchingCollisions) {
      cancelAnimationFrame(this.watchingCollisions)
      this.watchingCollisions = null
    }
  }

  public destroy() {
    isDev && console.log(`[Enemy ${this.uuid}] Destroy called:`)
    isDev && console.log(`- Current position:`, this.position.clone())
    isDev && console.log(`- Is already destroyed:`, this.userData.isDestroyed)

    this.stop()
    this.userData.isDestroyed = true
    scene.remove(this)
    isDev && console.log(`[Enemy ${this.uuid}] Destroy completed`)
  }

  public takeDamage(
    damage: number,
    type?: AllyType,
    hideDamageText: boolean = false
  ) {
    const colorMap = {
      [AllyType.WATER]: 0x4277ff,
      [AllyType.FIRE]: 0xff4444,
      [AllyType.EARTH]: 0x423333,
      [AllyType.AIR]: 0x42ffff,
    }

    if (!hideDamageText)
      showDamageText(
        damage,
        this.position.clone(),
        !!type ? colorMap[type] : 0xffffff
      )

    this.health -= damage

    if (this.health <= 0) {
      this.spawner.addScore(this.score)
      this.dropCoins()
      this.destroy()
    }
  }

  private dropCoins() {
    const [minDrop, maxDrop] = this.coinDropRange
    const coinDropDelta = maxDrop - minDrop
    const drop = Math.round(Math.random() * coinDropDelta) + minDrop

    this.spawner.collectDrop(drop)
  }
}
