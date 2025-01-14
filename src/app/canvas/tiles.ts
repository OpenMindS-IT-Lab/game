import * as THREE from 'three'
import { Colors } from './constants'
import { scene } from './scene'

const tiles: THREE.Mesh[] = []

const createTiles = (size: number = 2) => {
  const tileSize = size

  for (let x = -2; x <= 2; x++) {
    for (let z = -7; z <= 7; z++) {
      const tileGeometry = new THREE.BoxGeometry(tileSize, 0, tileSize)
      const tileMaterial = new THREE.MeshStandardMaterial(Colors.TILE)
      const tile = new THREE.Mesh(tileGeometry, tileMaterial)

      tile.position.set(x * tileSize, 0, z * tileSize)
      tile.userData = {
        isPersistant: true,
        active: false,
        isOccupied: tile.position.x === 0 && tile.position.z === 14,
      }
      tiles.push(tile)
      scene.add(tile)
    }
  }

  return tiles
}

export function hoverTile(intersects: THREE.Intersection[]) {
  tiles.forEach(tile => {
    const hoveredTile = intersects[0]?.object as THREE.Mesh
    const isHovered = hoveredTile === tile && hoveredTile.userData.isOccupied === false

    ;(tile.material as THREE.MeshStandardMaterial).opacity = isHovered
      ? Colors.HOVERED_TILE.opacity
      : Colors.TILE.opacity
  })
}

export default createTiles
export { tiles }
