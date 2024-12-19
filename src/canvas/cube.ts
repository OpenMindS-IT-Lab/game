import * as THREE from 'three'
import { Colors } from './constants'

const createCube = (scene: THREE.Scene, size: number = 2) => {
  const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshStandardMaterial(Colors.CUBE))

  cube.position.set(0, 1, 12)
  cube.userData = { isSelected: false, isPersistant: true }

  scene.add(cube)

  return cube
}

// Utility: Switch Cube State
export const switchObjectSelectionState = (object: THREE.Mesh, selected: boolean) => {
  object.material = new THREE.MeshStandardMaterial(selected ? Colors.SELECTED_CUBE : Colors.CUBE)
  object.userData.isSelected = selected
}

export const hoverCube = (cube: THREE.Mesh, intersection: THREE.Intersection[]) => {
  ;(cube.material as THREE.MeshStandardMaterial).opacity = 1

  if (intersection.length > 0) {
    const hoveredCube = intersection[0].object as THREE.Mesh

    ;(hoveredCube.material as THREE.MeshStandardMaterial).opacity = 0.6
  }
}

export default createCube
