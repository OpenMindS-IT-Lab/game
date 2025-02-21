import { compact, entries, values } from 'lodash'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import mainTowerImg from '../assets/main-tower.png'
import Game from '../game'
import { toggleTowerInfo } from '../ui/tower-info'
import { float, showDamageText } from '../utils'
import { Ally, AllyType } from './allies'
import { Colors } from './constants'
import EnemySpawner, { Enemy } from './enemies'
import { scene } from './scene'

class Tower extends THREE.Mesh {
  // __game?: Game

  title: string
  description: string
  image: string

  isSelected: boolean = false
  health: number = 0
  maxHealth: number = 0
  level: number
  speed: number = 0
  damage: number = 0
  cooldown: number = 0
  upgradeCost: number = 0
  shooting: Timeout
  allies: Record<AllyType, Ally | undefined>

  private priceMap: number[] = [
    5, 10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 12000, 16000, 40000, 80000, 120000, 160000, 400000, 800000,
    1200000, 1600000,
  ]

  constructor(size: number = 1) {
    // // Base of the tower
    // const baseGeometry = new THREE.BoxGeometry(size, size / 2, size)
    // baseGeometry.translate(0, size / 4, 0) // Піднімаємо базу

    // // Middle section of the tower
    // const middleGeometry = new THREE.CylinderGeometry(size / 2, size / 2, size, 32)
    // middleGeometry.translate(0, size, 0) // Піднімаємо середню секцію

    // // Top of the tower
    // const topGeometry = new THREE.ConeGeometry(size / 2, size, 32)
    // topGeometry.translate(0, size * 1.75, 0) // Піднімаємо верхівку

    // // Об'єднуємо всі геометрії в одну
    // const combinedGeometry = BufferGeometryUtils.mergeGeometries([baseGeometry, middleGeometry, topGeometry])

    // Octagonal Prism with Tapering
    const shape = new THREE.Shape()
    const radius = size / 2
    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2
      const x = Math.cos(theta) * radius
      const y = Math.sin(theta) * radius
      if (i === 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
    }
    shape.closePath()

    const extrudeSettings = {
      steps: 1,
      depth: 12,
      bevelEnabled: false,
      extrudePath: new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, size / 2),
        new THREE.Vector3(0, 0, size),
      ]),
    }

    const baseGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    baseGeometry.translate(0, 0, -size)
    baseGeometry.rotateX(Math.PI / 2)
    baseGeometry.rotateY(0)
    baseGeometry.rotateZ(0)

    // Tapering effect
    const taperAmount = 0.9 // Adjust for more/less tapering
    const position = baseGeometry.attributes.position
    for (let i = 0; i < position.count; i++) {
      const z = position.getZ(i)
      const scale = 1 - (1 - taperAmount) * (z / 12)
      position.setXY(i, position.getX(i) * scale, position.getY(i) * scale)
    }

    // Circular Ledge
    const ledgeGeometry = new THREE.TorusGeometry(size / 2, 0.1, 16, 100)
    ledgeGeometry.translate(0, 0, -size)
    ledgeGeometry.rotateX(Math.PI / 2)

    // Turret with Conical Barrel
    const turretGeometry = new THREE.CylinderGeometry(size / 4, size / 4, size, 32)
    turretGeometry.translate(0, size, 0)

    const barrelGeometry = new THREE.ConeGeometry(size / 6, size, 32)
    barrelGeometry.translate(0, -size / 6 + 0.75, -size * 2 + size / 2 + 0.25)
    barrelGeometry.rotateX(Math.PI / 2)

    // Assemble Main Tower
    const combinedGeometry = BufferGeometryUtils.mergeGeometries([
      baseGeometry.toNonIndexed(),
      ledgeGeometry.toNonIndexed(),
      turretGeometry.toNonIndexed(),
      barrelGeometry.toNonIndexed(),
    ])
    combinedGeometry.rotateY(Math.PI)

    // Створюємо матеріал
    const material = new THREE.MeshStandardMaterial({
      ...Colors.TOWER,
      emissive: Colors.TOWER.color,
      emissiveIntensity: 0.25,
      metalness: 0,
      roughness: 1,
    })

    // Створюємо Mesh із комбінованою геометрією
    super(combinedGeometry, material)

    this.title = 'Main Tower'
    this.description =
      'Unleash the precision of the Main Tower as it methodically targets the nearest enemy, firing with deadly accuracy and inflicting massive damage. This reliable sentinel stands as the cornerstone of your defenses.'
    this.image = mainTowerImg

    this.level = 0

    this.levelUp()
    this.shooting = 0

    this.receiveShadow = true
    this.castShadow = true

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

  select() {
    this.unselectAllies()
    ;(this.material as THREE.MeshStandardMaterial).color.set(Colors.SELECTED_TOWER.color)
    ;(this.material as THREE.MeshStandardMaterial).emissiveIntensity = 0
    this.isSelected = true
    toggleTowerInfo(this)
  }

  unselect() {
    ;(this.material as THREE.MeshStandardMaterial).color.set(Colors.TOWER.color)
    ;(this.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25
    this.isSelected = false
    toggleTowerInfo()
  }

  unselectAllies() {
    compact(values(this.allies))
      .filter(({ isSelected }) => isSelected)
      .forEach(ally => ally.unselect())
  }

  previewUpgrade() {
    const level = this.level + 1
    const health = this.calcHealth(this.level + 1)
    const damage = this.calcDamage(this.level + 1)
    const speed = this.calcSpeed(this.level + 1)
    const cooldown = this.calcCooldown(this.level + 1)

    return {
      level,
      health,
      damage,
      speed,
      cooldown,
    }
  }

  private calcHealth(level: number) {
    return this.health + (level || level + 1) * 10
  }
  private calcSpeed(level: number) {
    return float((level - 3 > 0 ? level - 3 : 1) / (level > 6 ? 10 : 6))
  }
  private calcDamage(level: number) {
    return float(level / 2 + 0.5 * level)
  }
  private calcCooldown(level: number) {
    return float(4000 / (level * 2))
  }

  levelUp() {
    this.level += 1
    this.health = this.calcHealth(this.level)
    this.maxHealth = this.health
    this.speed = this.calcSpeed(this.level)
    this.damage = this.calcDamage(this.level)
    this.cooldown = this.calcCooldown(this.level)
    this.upgradeCost = this.priceMap[this.level - 1]
  }

  updateAlliesPriceMap(score: number, totalUpgrades: number) {
    const newPriceMap = Ally.priceMap

    for (let [type, prices] of entries(newPriceMap)) {
      newPriceMap[type as AllyType] = prices.map(price => Math.round(price + score / totalUpgrades))
    }

    for (let [, ally] of entries(this.allies)) {
      if (ally) {
        ally.updatePrice(newPriceMap)
      }
    }
  }

  heal() {
    this.health = this.maxHealth
    values(this.allies).forEach(ally => {
      if (ally) ally.health = ally.maxHealth
    })
  }

  private shootAtNearestEnemy(enemies: Enemy[]): void {
    if (enemies.length === 0) return

    const towerPosition = this.position.clone()

    const nearestEnemy =
      enemies
        .filter(enemy => !enemy.userData.isDestroyed)
        .sort(({ position: a }, { position: b }) => a.distanceTo(towerPosition) - b.distanceTo(towerPosition))[0] ??
      null

    if (!nearestEnemy) return

    // Обчислюємо напрямок руху
    const speed = this.speed // Швидкість руху снаряда
    const enemyInitialPosition = nearestEnemy.position.clone()
    const direction = new THREE.Vector3()
      .subVectors(enemyInitialPosition, towerPosition)
      .multiplyScalar(2)
      .setY(0.5)
      .normalize()

    const rotation = this.rotation.clone()
    this.lookAt(enemyInitialPosition.clone())
    this.rotation.set(rotation.x, -this.rotation.y, rotation.z)

    new Projectile(towerPosition, this.damage, speed, direction).shoot()
  }

  public startShooting(enemies: Enemy[]): void {
    this.shooting = setInterval(() => this.shootAtNearestEnemy(enemies), this.cooldown)
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
      Game.__inst.end()
      // console.log(spawner.enemies)
      scene.remove(this)
    }
  }

  public spawnAlly(type: AllyType) {
    const newAlly = new Ally(type)
    // newAlly.__game = this.__game
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

export class Projectile extends THREE.Mesh {
  damage: number
  speed: number
  direction: THREE.Vector3
  initialPosition: THREE.Vector3
  constructor(position: THREE.Vector3, damage: number, speed: number, direction: THREE.Vector3) {
    // Створюємо снаряд
    const geometry = new THREE.SphereGeometry(0.1, 16, 16)
    const material = new THREE.MeshStandardMaterial({
      color: Colors.TOWER.color,
      metalness: 1,
      roughness: 0.1,
    })
    super(geometry, material)

    this.position.copy(position).setY(0.5) // Початкова позиція — позиція башти
    this.initialPosition = position
    this.damage = damage
    this.speed = speed
    this.direction = direction
    this.userData = {
      isPersistant: false,
      boundingBox: new THREE.Box3(),
    }

    const shockwaveGeometry = new THREE.RingGeometry(0.15, 0.25, 32)
    const shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: Colors.TOWER.color,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    })

    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial)
    shockwave.rotation.x = -Math.PI / 2
    shockwave.position.copy(this.position).setY(0.1)
    scene.add(shockwave)

    // Shockwave Animation
    function animateShockwave() {
      shockwave.scale.x += 0.1
      shockwave.scale.y += 0.1
      shockwave.material.opacity -= 0.02

      if (shockwave.material.opacity <= 0) {
        scene.remove(shockwave)
        return
      } else {
        requestAnimationFrame(animateShockwave)
      }
    }
    animateShockwave()

    scene.add(this)
  }

  // Анімація руху снаряда
  shoot() {
    const animateBullet = () => {
      this.position.addScaledVector(this.direction, this.speed)

      // Якщо снаряд виходить за межі сцени (додатковий захист від "завислих" снарядів)
      if (this.position.distanceTo(this.initialPosition) > 50) {
        scene.remove(this)
        return
      }

      requestAnimationFrame(animateBullet)
    }

    animateBullet()
  }
}
