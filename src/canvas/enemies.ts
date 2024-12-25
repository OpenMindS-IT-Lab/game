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

// Array to store all enemy meshes in the scene
const enemies: THREE.Mesh[] = []

// Функція для створення геометрії
function spawnEnemy(
  geometry: THREE.BoxGeometry | THREE.SphereGeometry | THREE.CylinderGeometry | THREE.IcosahedronGeometry,
  materialParams?: THREE.MeshStandardMaterialParameters,
  stats?: { speed?: number; height?: number }
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
  }

  const material = new THREE.MeshStandardMaterial({
    ...defaultMaterialParams,
    ...materialParams,
  })
  const newEnemy = new THREE.Mesh(geometry, material)
  const { speed, height } = { ...defaultStats, ...stats }

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
  }

  scene.add(newEnemy)
  enemies.push(newEnemy)

  const enemyInitialPosition = newEnemy.position.clone()
  const towerPosition =
    scene.children.find(child => child.name === 'Tower')?.position.clone() ??
    new THREE.Vector3(0, enemyInitialPosition.y, 14)
  const direction = new THREE.Vector3()
    .subVectors(towerPosition.setY(enemyInitialPosition.y), enemyInitialPosition)
    .normalize()

  newEnemy.lookAt(towerPosition)

  const fieldTiles = tiles.filter(tile => tile.position.z !== 14)

  let interval = setInterval(() => {
    newEnemy.position.addScaledVector(direction, speed).setY(enemyInitialPosition.y)

    // Оновлення статусу плитки
    fieldTiles.forEach(tile => {
      if (tile.position.distanceTo(newEnemy.position) <= 0.05) {
        tile.userData.isOccupied = true
      } else if (tile.userData.isOccupied && tile.position.distanceTo(newEnemy.position) > 1) {
        tile.userData.isOccupied = false
      }
    })

    const collisions = checkCollisionsAll(newEnemy)

    if (collisions.length > 0) {
      for (let collision of collisions) {
        // Видаляємо ворога та снаряд
        destroyEnemy(newEnemy)
        scene.remove(collision)
      }
      clearInterval(interval)
    }
  }, 1000 / 60) // 60 FPS

  return newEnemy
}

// Індивідуальні функції для кожного типу геометрії
export function spawnCube() {
  const geometry = new THREE.BoxGeometry(1.25, 1.25, 1.25)
  console.log('Spawned Cube')
  return spawnEnemy(geometry, {}, { height: 1.25 })
}

export function spawnSphere() {
  const geometry = new THREE.SphereGeometry(0.75, 16, 16)
  console.log('Spawned Sphere')
  return spawnEnemy(geometry, {}, { height: 1.5, speed: 0.1 })
}

export function spawnOctahedron() {
  const geometry = new THREE.OctahedronGeometry(0.9)
  geometry.rotateY(Math.PI / 4)
  console.log('Spawned Octahedron')
  return spawnEnemy(geometry, {}, { height: 1.8 })
}

export function spawnIcosahedron() {
  const geometry = new THREE.IcosahedronGeometry(0.9, 0)

  console.log('Spawned Icosahedron')
  return spawnEnemy(geometry, {}, { height: 1.8 })
}

export function spawnRandomEnemy() {
  console.log('Spawning random enemy')

  const EnemiesMap = {
    0: spawnCube,
    1: spawnSphere,
    2: spawnOctahedron,
    3: spawnIcosahedron,
  }

  const randomEnemy = EnemiesMap[Math.floor(Math.random() * 4) as keyof typeof EnemiesMap]()

  if (!randomEnemy) throw new Error('Failed to spawn new enemy!')
}

export function destroyEnemy(enemy: THREE.Mesh) {
  scene.remove(enemy)

  enemy.userData.isDestroyed = true
  enemies.sort(({ userData: { isDestroyed: a } }) => a)
  enemies.splice(0, enemies.length, ...enemies.filter(enemy => !enemy.userData.isDestroyed))
}

export { enemies }
