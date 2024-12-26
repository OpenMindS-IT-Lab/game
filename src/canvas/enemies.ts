import { difference, without } from 'lodash'
import * as THREE from 'three'
import { Colors } from './constants'
import { scene } from './scene'
import { tiles } from './tiles'
import { checkCollisionsAll } from './utils'

// Функція для створення випадкового кольору
function getRandomColor() {
  return Math.random() * 0xffffff
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

// Функція для створення геометрії
export default class EnemySpawner {
  private _enemies: THREE.Mesh[] = []

  public get enemies() {
    return this._enemies
  }
  private set enemies(enemies: THREE.Mesh[]) {
    this._enemies = enemies
  }

  constructor() {
    this.enemies = []
    this.intervals = []

    this.spawnEnemy = this.spawnEnemy.bind(this)
  }

  spawnEnemy(
    geometry: THREE.BoxGeometry | THREE.SphereGeometry | THREE.CylinderGeometry | THREE.IcosahedronGeometry,
    materialParams?: THREE.MeshStandardMaterialParameters,
    stats?: { speed?: number; height?: number; health?: number }
  ) {
    const defaultMaterialParams = {
      ...Colors.ENEMY,
      color: getRandomColor(),
      metalness: 0.3,
      roughness: 0.7,
    }

    const defaultStats = {
      speed: 0.05,
      height: 1,
      health: 1,
    }

    const material = new THREE.MeshStandardMaterial({
      ...defaultMaterialParams,
      ...materialParams,
    })
    const newEnemy = new THREE.Mesh(geometry, material)
    const { speed, height, health } = { ...defaultStats, ...stats }

    let randomPosition
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        randomPosition = getRandomPosition()
        newEnemy.position.copy(randomPosition).setY(height / 2 - 0.05)
        break
      } catch (error) {
        attempts++
        if (attempts >= maxAttempts) {
          console.error('Failed to generate position after multiple attempts:', error)
          return null
        }
      }
    }

    newEnemy.castShadow = true
    newEnemy.receiveShadow = true
    newEnemy.userData = {
      isPersistant: false,
      isSelected: false,
      boundingBox: new THREE.Box3(),
      initialColor: Colors.ENEMY,
      isDestroyed: false,
      health,
    }

    scene.add(newEnemy)
    this.enemies.push(newEnemy)

    const enemyInitialPosition = newEnemy.position.clone()
    const towerPosition =
      scene.children.find(child => child.name === 'Tower')?.position.clone() ??
      new THREE.Vector3(0, enemyInitialPosition.y, 14)
    const direction = new THREE.Vector3()
      .subVectors(towerPosition.setY(enemyInitialPosition.y), enemyInitialPosition)
      .normalize()

    newEnemy.lookAt(towerPosition)

    const fieldTiles = tiles.filter(tile => tile.position.z !== 14)

    let moveEnemyI = setInterval(() => {
      newEnemy.position.addScaledVector(direction, speed).setY(enemyInitialPosition.y)

      // Оновлення статусу плитки
      fieldTiles.forEach(tile => {
        if (tile.position.distanceTo(newEnemy.position) <= 0.05) {
          tile.userData.isOccupied = true
        } else if (tile.userData.isOccupied && tile.position.distanceTo(newEnemy.position) > 1) {
          tile.userData.isOccupied = false
        }
      })
    }, 1000 / 60) // 60 FPS

    let watchCollisionsI = setInterval(() => {
      const collisions = checkCollisionsAll(newEnemy)

      if (collisions.length > 0) {
        // Видаляємо ворога та снаряд

        for (let collision of collisions) {
          if ('damage' in collision.userData) {
            newEnemy.userData.health -= collision.userData.damage

            if (newEnemy.userData.health <= 0) {
              this.destroyEnemy(newEnemy)
              clearInterval(watchCollisionsI)
              clearInterval(moveEnemyI)
            }

            scene.remove(collision)
          }

          if (collision.name === 'Tower') clearInterval(moveEnemyI)
          //
          // else clearInterval(moveEnemyI)
        }
      }
    }, 1000 / 60) // 60 FPS

    return newEnemy
  }

  destroyEnemy(enemy: THREE.Mesh) {
    scene.remove(enemy)

    enemy.userData.isDestroyed = true
    this.enemies.sort(({ userData: { isDestroyed: a } }) => a)
    this.enemies.splice(0, this.enemies.length, ...this.enemies.filter(enemy => !enemy.userData.isDestroyed))
  }

  // Індивідуальні функції для кожного типу геометрії
  // FAT ENEMY

  spawnCube() {
    const geometry = new THREE.BoxGeometry(1.25, 1.25, 1.25)
    console.log('Spawned Cube')
    return this.spawnEnemy(geometry, {}, { height: 1.25, health: 2 })
  }

  // FAST ENEMY
  spawnSphere() {
    const geometry = new THREE.SphereGeometry(0.75, 16, 16)
    console.log('Spawned Sphere')
    return this.spawnEnemy(geometry, {}, { height: 1.5, speed: 0.1 })
  }

  spawnOctahedron() {
    const geometry = new THREE.OctahedronGeometry(0.9)
    geometry.rotateY(Math.PI / 4)
    console.log('Spawned Octahedron')
    return this.spawnEnemy(geometry, {}, { height: 1.8 })
  }

  spawnIcosahedron() {
    const geometry = new THREE.IcosahedronGeometry(0.9, 0)

    console.log('Spawned Icosahedron')
    return this.spawnEnemy(geometry, {}, { height: 1.8 })
  }

  spawnRandomEnemy() {
    console.log('Spawning random enemy')
    const _spawner = this

    const EnemiesMap = {
      0: this.spawnCube.bind(_spawner),
      1: this.spawnSphere.bind(_spawner),
      2: this.spawnOctahedron.bind(_spawner),
      3: this.spawnIcosahedron.bind(_spawner),
    }

    const randomEnemy = EnemiesMap[Math.floor(Math.random() * 4) as keyof typeof EnemiesMap]()

    if (!randomEnemy) throw new Error('Failed to spawn new enemy!')

    return randomEnemy
  }

  private _intervals = [] as number[]

  get intervals() {
    return this._intervals
  }

  private set intervals(entrries: number[]) {
    difference(this._intervals, entrries).forEach(clearInterval)

    this._intervals = entrries
  }

  private startI = 0
  public start(rate: number = 1000) {
    this.startI = setInterval(() => this.spawnRandomEnemy(), rate)
    this.intervals.push(this.startI)
  }

  public stop() {
    this.intervals = without(this.intervals, this.startI)
  }
}
