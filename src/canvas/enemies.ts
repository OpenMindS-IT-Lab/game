import * as THREE from 'three'
import { Colors } from './constants'
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
    let randomIndex = Math.round(Math.random() * freeTiles.length)

    console.log(freeTiles)

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

const enemies: THREE.Mesh[] = []

// Функція для створення геометрії
function spawnEnemy(
  scene: THREE.Scene,
  // tiles: THREE.Mesh[],
  geometry: THREE.BoxGeometry | THREE.SphereGeometry | THREE.CylinderGeometry | THREE.IcosahedronGeometry,
  customMaterial?: THREE.MeshStandardMaterial,
  initialY?: number
) {
  const material =
    customMaterial ??
    new THREE.MeshStandardMaterial({
      ...Colors.ENEMY,
      // color: getRandomColor(),
      metalness: 0.3,
      roughness: 0.7,
    })
  const mesh = new THREE.Mesh(geometry, material)

  try {
    const position = getRandomPosition()
    mesh.position.set(position.x, initialY ?? 0.5, position.z)
  } catch (error) {
    console.error(error)
    return null
  }

  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData = {
    isPersistant: false,
    isSelected: false,
    boundingBox: new THREE.Box3(),
    initialColor: Colors.ENEMY,
    isDestroyed: false,
  }

  scene.add(mesh)
  enemies.push(mesh)

  return mesh
}

// Індивідуальні функції для кожного типу геометрії
export function spawnCube(scene: THREE.Scene) {
  const geometry = new THREE.BoxGeometry(1.25, 1.25, 1.25)
  console.log('Spawned Cube')
  return spawnEnemy(scene, geometry, undefined, 0.625)
}

export function spawnSphere(scene: THREE.Scene) {
  const geometry = new THREE.SphereGeometry(0.75, 16, 16)
  console.log('Spawned Sphere')
  return spawnEnemy(scene, geometry, undefined, 0.75)
}

export function spawnOctahedron(scene: THREE.Scene) {
  const geometry = new THREE.OctahedronGeometry(0.9)
  geometry.rotateY(Math.PI / 4)
  console.log('Spawned Octahedron')
  return spawnEnemy(scene, geometry, undefined, 0.9)
}

export function spawnIcosahedron(scene: THREE.Scene) {
  const geometry = new THREE.IcosahedronGeometry(0.9, 0)
  console.log('Spawned Icosahedron')
  return spawnEnemy(scene, geometry, undefined, 0.9)
}

export function spawnRandomEnemy(scene: THREE.Scene) {
  console.log('Spawning random enemy')

  let speed = 0

  const EnemiesMap = {
    0() {
      speed = 0.05
      return spawnCube(scene)
    },
    1() {
      speed = 0.1
      return spawnSphere(scene)
    },
    2() {
      speed = 0.05
      return spawnOctahedron(scene)
    },
    3() {
      speed = 0.05
      return spawnIcosahedron(scene)
    },
  }

  const newEnemy = EnemiesMap[Math.round(Math.random() * 3) as keyof typeof EnemiesMap]()

  if (!newEnemy) throw new Error('Failed to spawn new enemy!')

  const enemyInitialPosition = newEnemy.position.clone()
  const towerPosition =
    scene.children.find(child => child.name === 'Tower')?.position.clone() ??
    new THREE.Vector3(0, enemyInitialPosition.y, 14)
  const direction = new THREE.Vector3()
    .subVectors(towerPosition.setY(enemyInitialPosition.y), enemyInitialPosition)
    .normalize()

  let interval = setInterval(() => {
    newEnemy.position.addScaledVector(direction, speed).setY(enemyInitialPosition.y)

    // Оновлення статусу плитки
    tiles.forEach(tile => {
      if (tile.position.distanceTo(newEnemy.position) <= 0.05) {
        tile.userData.isOccupied = true
      } else if (tile.userData.isOccupied && tile.position.distanceTo(newEnemy.position) > 1) {
        tile.userData.isOccupied = false
      }
    })

    const collisions = checkCollisionsAll(newEnemy, scene)

    if (collisions.length > 0) {
      for (let collision of collisions) {
        // Видаляємо ворога та снаряд
        destroyEnemy(newEnemy, scene)
        scene.remove(collision)
        clearInterval(interval)
      }
    }
  }, 1000 / 60) // 60 FPS
}

// export function moveEnemiesTowardTower(tower: THREE.Mesh, scene: THREE.Scene) {
//   const speed = 0.02

//   enemies.forEach(enemy => {
//     const towerPosition = tower.position.clone().setY(enemy.position.y)
//     const direction = new THREE.Vector3().subVectors(towerPosition, enemy.position.clone()).normalize()
//     enemy.position.addScaledVector(direction, speed)

//     // Оновлення статусу плитки
//     tiles.forEach(tile => {
//       if (tile.position.distanceTo(enemy.position) < 0.5) {
//         tile.userData.isOccupied = true
//       } else if (tile.userData.isOccupied && tile.position.distanceTo(enemy.position) > 0.5) {
//         tile.userData.isOccupied = false
//       }
//     })
//   })

//   const collision = checkCollision(tower, enemies)
//   if (collision) destroyEnemy(collision, scene)
// }

export function destroyEnemy(enemy: THREE.Mesh, scene: THREE.Scene) {
  scene.remove(enemy)

  enemy.userData.isDestroyed = true
  enemies.sort(({ userData: { isDestroyed: a } }) => a)
  enemies.shift()
}

export { enemies }
