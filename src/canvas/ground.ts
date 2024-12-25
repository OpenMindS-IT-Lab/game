import * as THREE from 'three'
import { Colors } from './constants'
import { scene } from './scene'

const createGround = () => {
  const gridHelper = new THREE.GridHelper(34, 17, 0x444444, 0x111111)
  gridHelper.userData = { isPersistant: true }
  scene.add(gridHelper)

  const planeGeometry = new THREE.PlaneGeometry(10, 30)
  const planeMaterial = new THREE.MeshStandardMaterial({ ...Colors.PLANE })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.01
  plane.userData = { isPersistant: true }
  scene.add(plane)

  return { gridHelper, plane }
}

export default createGround
