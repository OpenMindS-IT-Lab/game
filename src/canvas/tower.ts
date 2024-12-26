import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { Colors } from './constants'
import { scene } from './scene'

const createTower = (size: number = 2) => {
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
  tower.position.set(0, 0, 14)
  tower.userData = {
    isSelected: false,
    isPersistant: true,
    boundingBox: new THREE.Box3(),
    initialColor: Colors.TOWER,
  }
  tower.name = 'Tower'

  // Додаємо tower у сцену
  scene.add(tower)

  return tower
}

export default createTower

export function shootAtNearestEnemy(tower: THREE.Mesh, enemies: THREE.Mesh[]): void {
  if (enemies.length === 0) return

  const towerPosition = tower.position.clone()

  const enemy =
    enemies.sort(({ position: a }, { position: b }) => a.distanceTo(towerPosition) - b.distanceTo(towerPosition))[0] ??
    null

  if (!enemy) return

  // Обчислюємо напрямок руху
  const speed = 0.25 // Швидкість руху снаряда
  const enemyInitialPosition = enemy.position.clone()
  const direction = new THREE.Vector3()
    .subVectors(enemyInitialPosition, tower.position.clone())
    .multiplyScalar(2)
    .normalize()

  // Створюємо снаряд
  const projectileGeometry = new THREE.SphereGeometry(0.1, 16, 16)
  const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 1, roughness: 0.1 })
  const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial)

  projectile.position.copy(tower.position).setY(enemyInitialPosition.y / 2) // Початкова позиція — позиція башти
  projectile.castShadow = true
  projectile.receiveShadow = true
  projectile.userData = { isPersistant: false, boundingBox: new THREE.Box3(), damage: 1 }

  scene.add(projectile)

  // Анімація руху снаряда
  const interval = setInterval(() => {
    // Рухаємо снаряд у напрямку ворога
    projectile.position.addScaledVector(direction, speed)

    // Якщо снаряд виходить за межі сцени (додатковий захист від "завислих" снарядів)
    if (projectile.position.distanceTo(tower.position) > 50) {
      scene.remove(projectile)
      clearInterval(interval)
    }
  }, 1000 / 60)
}
