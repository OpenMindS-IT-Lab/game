import * as THREE from 'three'
import { Colors } from './constants'

const createTiles = (scene: THREE.Scene, size: number = 2) => {
  const tiles: THREE.Mesh[] = []
  const tileSize = size

  for (let x = -3; x <= 3; x++) {
    for (let z = -7; z <= 7; z++) {
      const tileGeometry = new THREE.BoxGeometry(tileSize, 0, tileSize)
      const tileMaterial = new THREE.MeshStandardMaterial(Colors.TILE)
      const tile = new THREE.Mesh(tileGeometry, tileMaterial)

      tile.position.set(x * tileSize, 0, z * tileSize)
      tile.userData = {
        isPersistant: true,
        active: false,
        isOccupied: tile.position.x === 0 && tile.position.z === 12,
      }
      tiles.push(tile)
      scene.add(tile)
    }
  }

  return tiles
}

export const hoverTile = (tiles: THREE.Mesh[], intersection: THREE.Intersection[]) => {
  tiles.forEach(tile => {
    ;(tile.material as THREE.MeshStandardMaterial).opacity = Colors.TILE.opacity
  }) // Скидаємо колір

  if (intersection.length > 0) {
    const hoveredTile = intersection[0].object as THREE.Mesh

    ;(hoveredTile.material as THREE.MeshStandardMaterial).opacity = Colors.HOVERED_TILE.opacity // Підсвічуємо жовтим
  }
}

export default createTiles
