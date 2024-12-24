import * as THREE from 'three'
import { AllyTypes, Colors } from './constants'
import { tiles } from './tiles'

// Функція для створення випадкового кольору
function getRandomColor() {
  return Math.random() * 0xffffff
}

// Функція для випадкового розташування
function getRandomPosition() {
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

  return {
    x: targetTile.position.x,
    y: 0,
    z: targetTile.position.z,
  }
}

const allies: THREE.Mesh[] = []

// Функція для створення геометрії
function spawnAlly(
  scene: THREE.Scene,
  geometry: THREE.BoxGeometry | THREE.SphereGeometry | THREE.CylinderGeometry | THREE.IcosahedronGeometry,
  customColor?: THREE.MeshStandardMaterialParameters,
  initialY?: number
) {
  const material = new THREE.MeshStandardMaterial({
    ...(customColor ?? Colors.ALLY),
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
    initialColor: material.color,
  }

  scene.add(mesh)
  allies.push(mesh)
}

// Індивідуальні функції для кожного типу геометрії
export function spawnEarthTower(scene: THREE.Scene) {
  const geometry = new THREE.BoxGeometry(1.25, 1.25, 1.25)
  return () => spawnAlly(scene, geometry, AllyTypes.EARTH, 0.625)
}

export function spawnAirTower(scene: THREE.Scene) {
  const geometry = new THREE.SphereGeometry(0.75, 16, 16)
  return () => spawnAlly(scene, geometry, AllyTypes.AIR, 0.75)
}

export function spawnFireTower(scene: THREE.Scene) {
  const geometry = new THREE.OctahedronGeometry(0.9)
  geometry.rotateY(Math.PI / 4)

  return () => spawnAlly(scene, geometry, AllyTypes.FIRE, 0.9)
}

export function spawnWaterTower(scene: THREE.Scene) {
  const geometry = new THREE.IcosahedronGeometry(0.9, 0)
  return () => spawnAlly(scene, geometry, AllyTypes.WATER, 0.9)
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
  tiles.forEach(tile => {
    if (tile.position.x === 0 && tile.position.z === 14) tile.userData.isOccupied = true
    else tile.userData.isOccupied = false
  })
  camera.position.y = 20 // Повертаємо камеру на висоту

  console.log(tiles)
}

export { allies }
