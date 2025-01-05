import * as THREE from 'three'

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
const initialCameraPosition = new THREE.Vector3(0, 14, 18)
const initialCameraRotation = new THREE.Euler(-0.9, 0, 0)

const resetCamera = () => {
  camera.lookAt(0, 0, 0)
  
  camera.position.copy(initialCameraPosition)
  camera.rotation.copy(initialCameraRotation)
}

camera.userData = { isPersistant: true }

export default camera
export { initialCameraPosition, initialCameraRotation, resetCamera }
