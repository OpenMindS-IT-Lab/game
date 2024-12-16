import * as THREE from 'three'
import { Colors } from './constants'

const createCube = (scene: THREE.Scene, size: number = 2) => {
  const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshStandardMaterial(Colors.CUBE))

  cube.position.set(0, 0, 0)
  cube.userData = { isSelected: false }

  scene.add(cube)

  return cube
}

// Utility: Switch Cube State
export const switchObjectSelectionState = (object: THREE.Mesh, selected: boolean) => {
  object.material = new THREE.MeshStandardMaterial(selected ? Colors.SELECTED_CUBE : Colors.CUBE)
  object.userData.isSelected = selected
}

export default createCube