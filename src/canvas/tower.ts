import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { Colors } from './constants'

const createTower = (scene: THREE.Scene, size: number = 2) => {
  // Base of the tower
  const baseGeometry = new THREE.BoxGeometry(size, size / 2, size)
  baseGeometry.translate(0, size / 4, 0) // Піднімаємо базу

  // Middle section of the tower
  const middleGeometry = new THREE.CylinderGeometry(size / 2, size / 2, size, 32)
  middleGeometry.translate(0, size, 0) // Піднімаємо середню секцію

  // Top of the tower
  const topGeometry = new THREE.ConeGeometry(size / 2, size, 32)
  topGeometry.translate(0, size * 1.75, 0) // Піднімаємо верхівку

  // Об'єднуємо всі геометрії в одну
  const combinedGeometry = BufferGeometryUtils.mergeGeometries([baseGeometry, middleGeometry, topGeometry])

  // Створюємо матеріал
  const material = new THREE.MeshStandardMaterial(Colors.TOWER)

  // Створюємо Mesh із комбінованою геометрією
  const tower = new THREE.Mesh(combinedGeometry, material)

  // Встановлюємо позицію та userData
  tower.position.set(0, 0, 12)
  tower.userData = {
    isSelected: false,
    isPersistant: true,
    boundingBox: new THREE.Box3(),
    initialColor: Colors.TOWER,
  }

  // Додаємо tower у сцену
  scene.add(tower)

  return tower
}

export default createTower
