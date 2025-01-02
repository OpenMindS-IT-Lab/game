import { entries } from 'lodash'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { Ally, AllyType } from './allies'
import { Colors } from './constants'
import EnemySpawner, { Enemy } from './enemies'
import { scene } from './scene'
import { showDamageText } from './utils'

class Tower extends THREE.Mesh {
  health: number = 0
  level: number
  bulletSpeed: number = 0
  bulletDamage: number = 0
  bulletCooldown: number = 0
  shooting: number
  upgradeCost: number = 0
  allies: Record<AllyType, Ally | undefined>

  private priceMap: number[] = [10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 12000, 16000]

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

    this.level = 0

    this.levelUp()
    // this.health = this.level * 10
    // this.bulletSpeed = this.level / 8
    // this.bulletDamage = this.level / 2 + 0.5
    // this.bulletCooldown = (1 / (this.level * 2)) * 1500
    // this.upgradeCost = this.priceMap[this.level - 1]
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

    this.allies = {
      [AllyType.EARTH]: undefined,
      [AllyType.AIR]: undefined,
      [AllyType.FIRE]: undefined,
      [AllyType.WATER]: undefined,
    }

    // Додаємо tower у сцену
    scene.add(this)
  }

  updateAlliesCosts(score: number, divisor: number) {
    for (let [type] of entries(this.allies).filter(ally => !!ally)) {
      Ally.updateCost(type as AllyType, score, divisor)
    }
  }

  previewUpgrade() {
    return `
      Main Tower

      COST: ${this.upgradeCost}

      Health: ${this.health} (+${this.calcHealth() - this.health}) 
      Bullet Speed: ${this.bulletSpeed} (+${this.calcSpeed() - this.bulletSpeed})
      Bullet Damage: ${this.bulletDamage} (+${this.calcDamage() - this.bulletDamage})
      Bullet Cooldown: ${this.bulletCooldown} (${this.calcCooldown() - this.bulletCooldown})
    `
  }

  private calcHealth() {
    return this.health + (this.level || this.level + 1) * 10
  }
  private calcSpeed() {
    return parseFloat(((this.level - 2 > 0 ? this.level - 2 : 1) / 6).toFixed(2))
  }
  private calcDamage() {
    return parseFloat(((this.level + 1) / 2 + 0.25 * (this.level + 2)).toFixed(2))
  }
  private calcCooldown() {
    return parseFloat((4000 / ((this.level + 1) * 2)).toFixed(2))
  }

  levelUp(_score?: number, _divisor?: number) {
    this.health = this.calcHealth()
    this.bulletSpeed = this.calcSpeed()
    this.bulletDamage = this.calcDamage()
    this.bulletCooldown = this.calcCooldown()
    this.level += 1
    this.upgradeCost = this.priceMap[this.level - 1]
  }

  private shootAtNearestEnemy(enemies: Enemy[]): void {
    if (enemies.length === 0) return

    const towerPosition = this.position.clone()

    const nearestEnemy =
      enemies
        .filter(enemy => !enemy.userData.isAnimating.currentState && !enemy.userData.isDestroyed)
        .sort(({ position: a }, { position: b }) => a.distanceTo(towerPosition) - b.distanceTo(towerPosition))[0] ??
      null

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
    if (this.shooting) {
      this.stopShooting()
    }

    this.shooting = setInterval(() => this.shootAtNearestEnemy(enemies), this.bulletCooldown)
  }

  public stopShooting() {
    if (this.shooting) {
      clearInterval(this.shooting)
      this.shooting = 0
    }
  }

  public takeDamage(damage: number, spawner: EnemySpawner) {
    this.health -= damage

    showDamageText(damage, this.position, 0xff0000)

    if (this.health <= 0) {
      this.stopShooting()
      spawner.stop()
      // console.log(spawner.enemies)
      scene.remove(this)
    }
  }

  public spawnAlly(type: AllyType) {
    const newAlly = new Ally(type)
    this.allies[type] = newAlly
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
