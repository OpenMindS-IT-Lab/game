import * as THREE from 'three'

// Функція для створення випадкового кольору
function getRandomColor() {
  return Math.random() * 0xffffff
}

// Функція для випадкового розташування
function getRandomPosition(tiles: THREE.Mesh[]) {
  let targetTile

  const getRandomFreeTile = () => {
    let freeTiles = tiles.filter(tile => !tile.userData.isOccupied)
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

  // let position = generateRandomVector2()
  // let tile = tiles.find(tile => tile.position.x === position.x && tile.position.z === position.z)

  // while (tile?.userData.isOccupied && freeTiles.length > 0) {
  //   position = generateRandomVector2()
  //   tile = tiles.find(tile => tile.position.x === position.x && tile.position.z === position.z)
  //   freeTiles.indexOf(tile!)
  // }

  // tile!.userData.isOccupied = true

  // return {
  //   ...position,
  //   y: 0, // Від 0 до 5
  // }
}

// Функція для створення геометрії
function spawnEnemy(
  geometry: THREE.BoxGeometry | THREE.SphereGeometry | THREE.ConeGeometry | THREE.IcosahedronGeometry,
  scene: THREE.Scene,
  tiles: THREE.Mesh[]
) {
  const material = new THREE.MeshStandardMaterial({ color: getRandomColor() })
  const mesh = new THREE.Mesh(geometry, material)

  try {
    const position = getRandomPosition(tiles)
    mesh.position.set(position.x, position.y, position.z)
  } catch (error) {
    console.error(error)
    return
  }

  const scale = Math.random() * 1.5 + 0.5 // Від 0.5 до 2
  mesh.scale.set(scale, scale, scale)

  mesh.castShadow = true
  mesh.receiveShadow = true

  scene.add(mesh)
}

// Індивідуальні функції для кожного типу геометрії
export function spawnCube(scene: THREE.Scene, tiles: THREE.Mesh[]) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  return () => spawnEnemy(geometry, scene, tiles)
}

export function spawnSphere(scene: THREE.Scene, tiles: THREE.Mesh[]) {
  const geometry = new THREE.SphereGeometry(0.5, 16, 16)
  return () => spawnEnemy(geometry, scene, tiles)
}

export function spawnPyramid(scene: THREE.Scene, tiles: THREE.Mesh[]) {
  const geometry = new THREE.ConeGeometry(0.5, 1, 4)
  return () => spawnEnemy(geometry, scene, tiles)
}

export function spawnIcosahedron(scene: THREE.Scene, tiles: THREE.Mesh[]) {
  const geometry = new THREE.IcosahedronGeometry(0.5, 0)
  return () => spawnEnemy(geometry, scene, tiles)
}

export function deleteAllObjects(scene: THREE.Scene) {
  const objectsToRemove: THREE.Object3D<THREE.Object3DEventMap>[] = []

  scene.traverse(object => {
    if (!object.userData.isPersistant) {
      objectsToRemove.push(object)
    }
  })

  scene.remove(...objectsToRemove)
}

export const resetScene = (scene: THREE.Scene, tiles: THREE.Mesh[]) => () => {
  deleteAllObjects(scene) // Видаляємо всі об'єкти
  tiles.forEach(tile => (tile.userData.isOccupied = false))
  // createGround(scene) // Переставляємо землю
  // scene.background = new THREE.Color(0x000000) // Скидаємо фон
}
