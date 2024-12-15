import * as THREE from 'three'
import { Colors } from './constants';

const createGround = (scene: THREE.Scene) => {
  const gridHelper = new THREE.GridHelper(30, 15, 0x444444, 0x111111)
  scene.add(gridHelper)

  const planeGeometry = new THREE.PlaneGeometry(14, 30)
  const planeMaterial = new THREE.MeshStandardMaterial({ color: Colors.PLANE })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.01
  scene.add(plane)

  return { gridHelper, plane }
}

export default createGround
