import * as THREE from 'three'
import { Colors } from './constants'
import { tiles } from './tiles'

// Функція для створення випадкового кольору
function getRandomColor() {
  return Math.random() * 0xffffff
}

// Функція для випадкового розташування
function getRandomPosition() {
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
    return
  }

  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData = {
    isPersistant: false,
    isSelected: false,
    boundingBox: new THREE.Box3(),
    initialColor: Colors.ENEMY,
  }

  scene.add(mesh)
  enemies.push(mesh)
}

// Індивідуальні функції для кожного типу геометрії
export function spawnCube(scene: THREE.Scene) {
  const geometry = new THREE.BoxGeometry(1.25, 1.25, 1.25)
  return () => spawnEnemy(scene, geometry, undefined, 0.625)
}

export function spawnSphere(scene: THREE.Scene) {
  const geometry = new THREE.SphereGeometry(0.75, 16, 16)
  return () => spawnEnemy(scene, geometry, undefined, 0.75)
}

export function spawnOctahedron(scene: THREE.Scene) {
  const geometry = new THREE.OctahedronGeometry(0.9)
  geometry.rotateY(Math.PI / 4)

  return () => spawnEnemy(scene, geometry, undefined, 0.9)
}

export function spawnIcosahedron(scene: THREE.Scene) {
  const geometry = new THREE.IcosahedronGeometry(0.9, 0)
  return () => spawnEnemy(scene, geometry, undefined, 0.9)
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

export const resetScene = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => () => {
  deleteAllObjects(scene) // Видаляємо всі об'єкти
  tiles?.forEach(tile => (tile.userData.isOccupied = false))
  camera.position.y = 20 // Повертаємо камеру на висоту
}

export { enemies }
