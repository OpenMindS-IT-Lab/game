import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { Ally, AllyType } from './allies'
import { Colors } from './constants'
import EnemySpawner, { Enemy } from './enemies'
import { scene } from './scene'
import { showDamageText } from './utils'

class Tower extends THREE.Mesh {
  health: number
  level: number
  bulletSpeed: number
  bulletDamage: number
  bulletCooldown: number
  shooting: number
  allies: Ally[]

  constructor(size: number = 1) {
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
    super(combinedGeometry, material)

    this.level = 1
    this.health = this.level * 10
    this.bulletSpeed = this.level / 4
    this.bulletDamage = this.level / 2 + 0.5
    this.bulletCooldown = (1 / this.level) * 1000
    this.shooting = 0

    // Встановлюємо позицію та userData
    this.position.set(0, 0, 14)
    this.userData = {
      isSelected: false,
      isPersistant: true,
      boundingBox: new THREE.Box3(),
      initialColor: Colors.TOWER,
      health: this.health,
    }
    this.name = 'Tower'

    this.allies = []

    // Додаємо tower у сцену
    scene.add(this)
  }

  private shootAtNearestEnemy(enemies: Enemy[]): void {
    if (enemies.length === 0) return

    const towerPosition = this.position.clone()

    const nearestEnemy =
      enemies.sort(
        ({ position: a }, { position: b }) => a.distanceTo(towerPosition) - b.distanceTo(towerPosition)
      )[0] ?? null

    if (!nearestEnemy) return

    // Обчислюємо напрямок руху
    const speed = this.bulletSpeed // Швидкість руху снаряда
    const enemyInitialPosition = nearestEnemy.position.clone()
    const direction = new THREE.Vector3()
      .subVectors(enemyInitialPosition, towerPosition)
      .multiplyScalar(2)
      .setY(0.5)
      .normalize()

    // Створюємо снаряд
    const projectileGeometry = new THREE.SphereGeometry(0.1, 16, 16)
    const projectileMaterial = new THREE.MeshStandardMaterial({
      color: Colors.TOWER.color,
      metalness: 1,
      roughness: 0.1,
    })
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial)

    projectile.position.copy(this.position).setY(0.5) // Початкова позиція — позиція башти
    projectile.castShadow = true
    projectile.receiveShadow = true
    projectile.userData = {
      isPersistant: false,
      boundingBox: new THREE.Box3(),
      damage: this.bulletDamage,
      projectile: true,
    }

    scene.add(projectile)

    // Анімація руху снаряда
    const interval = setInterval(() => {
      // Рухаємо снаряд у напрямку ворога
      projectile.position.addScaledVector(direction, speed)

      // Якщо снаряд виходить за межі сцени (додатковий захист від "завислих" снарядів)
      if (projectile.position.distanceTo(towerPosition) > 50) {
        scene.remove(projectile)
        clearInterval(interval)
      }
    }, 1000 / 60)
  }

  public startShooting(enemies: Enemy[]): void {
    this.shooting = setInterval(() => this.shootAtNearestEnemy(enemies), this.bulletCooldown)
  }

  public stopShooting() {
    if (this.shooting) clearInterval(this.shooting)
  }

  public takeDamage(damage: number, spawner: EnemySpawner) {
    this.health -= damage

    showDamageText(damage, this.position, 0xff0000)

    if (this.health <= 0) {
      this.stopShooting()
      spawner.stop()
      scene.remove(this)
    }
  }

  public spawnAlly(type: AllyType) {
    const newAlly = new Ally(type)
    this.allies.push(newAlly)
    return newAlly
  }

  // Індивідуальні функції для кожного типу геометрії
  public spawnEarthTower() {
    return this.spawnAlly(AllyType.EARTH)
  }

  public spawnAirTower() {
    return this.spawnAlly(AllyType.AIR)
  }

  public spawnFireTower() {
    return this.spawnAlly(AllyType.FIRE)
  }

  public spawnWaterTower() {
    return this.spawnAlly(AllyType.WATER)
  }
}

export default Tower
