import * as THREE from 'three'
import { AllyTypes, Colors } from './constants'
import { scene } from './scene'
import { tiles } from './tiles'

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

  return targetTile.position.clone().setY(0)
}

const allies: THREE.Mesh[] = []

// Функція для створення геометрії
function spawnAlly(
  geometry: THREE.BoxGeometry | THREE.SphereGeometry | THREE.CylinderGeometry | THREE.IcosahedronGeometry,
  materialParamenters?: THREE.MeshStandardMaterialParameters,
  initialY?: number
) {
  const material = new THREE.MeshStandardMaterial({
    ...(materialParamenters ?? Colors.ALLY),
    metalness: 0.3,
    roughness: 0.7,
  })
  const mesh = new THREE.Mesh(geometry, material)

  try {
    const position = getRandomPosition()
    mesh.position.copy(position).setY(initialY ?? 0.5)
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

  console.log(
    tiles
      .filter(tile => tile.userData.isOccupied)
      .map(({ position: { x, z } }) => `X: ${x}; Z: ${z} ;`)
      .join('\n')
  )
}

// Індивідуальні функції для кожного типу геометрії
export function spawnEarthTower() {
  const geometry = new THREE.BoxGeometry(1.25, 1.25, 1.25)
  spawnAlly(geometry, AllyTypes.EARTH, 0.625)
}

export function spawnAirTower() {
  const geometry = new THREE.SphereGeometry(0.75, 16, 16)

  spawnAlly(geometry, AllyTypes.AIR, 0.75)
}

export function spawnFireTower() {
  const geometry = new THREE.OctahedronGeometry(0.9)
  geometry.rotateY(Math.PI / 4)

  spawnAlly(geometry, AllyTypes.FIRE, 0.9)
}

export function spawnWaterTower() {
  const geometry = new THREE.IcosahedronGeometry(0.9, 0)
  spawnAlly(geometry, AllyTypes.WATER, 0.9)
}

export { allies }
