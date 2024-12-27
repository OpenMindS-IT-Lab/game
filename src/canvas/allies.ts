import * as THREE from 'three'
import { Enemy } from './enemies'
import { scene } from './scene'
import { tiles } from './tiles'

export const enum AllyType {
  WATER = 'water',
  FIRE = 'fire',
  EARTH = 'earth',
  AIR = 'air',
}

export const geometryMap = {
  [AllyType.WATER]: () => new THREE.SphereGeometry(0.75, 16, 16),
  [AllyType.FIRE]: () => new THREE.OctahedronGeometry(0.9).rotateY(Math.PI / 4),
  [AllyType.EARTH]: () => new THREE.BoxGeometry(1.25, 1.25, 1.25),
  [AllyType.AIR]: () => new THREE.IcosahedronGeometry(0.9, 0),
}

export const materialMap = {
  [AllyType.WATER]: { color: 0x4277ff, transparent: true, opacity: 1 },
  [AllyType.FIRE]: { color: 0xff4444, transparent: true, opacity: 1 },
  [AllyType.EARTH]: { color: 0x423333, transparent: true, opacity: 1 },
  [AllyType.AIR]: { color: 0x42ffff, transparent: true, opacity: 1 },
}

export const heightMap = {
  [AllyType.WATER]: 1.5,
  [AllyType.FIRE]: 1.8,
  [AllyType.EARTH]: 1.25,
  [AllyType.AIR]: 1.8,
}

// Функція для випадкового розташування
function getRandomPosition() {
  let targetTile

  const getRandomFreeTile = () => {
    let freeTiles = tiles.filter(tile => !tile.userData.isOccupied && tile.position.z === 14)
    let randomIndex = Math.round(Math.random() * freeTiles.length)

    if (freeTiles.length === 0) {
      throw new Error("Can't spawn new ally! All tiles are occupied!")
    }

    return freeTiles[randomIndex]
  }

  do {
    targetTile = getRandomFreeTile()
  } while (!targetTile)

  targetTile.userData.isOccupied = true

  return targetTile.position.clone().setY(0)
}

export class Ally extends THREE.Mesh {
  allyTowerType: AllyType
  level: number
  health: number
  damage: number
  speed: number
  height: number
  skillCooldown: number
  casting: number

  constructor(type: AllyType) {
    const geometry = geometryMap[type]()
    const material = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.7, ...materialMap[type] })

    super(geometry, material)

    this.allyTowerType = type
    this.height = heightMap[this.allyTowerType]
    this.level = 1
    this.damage = this.level / 2 + 0.5
    this.speed = this.level / 4
    this.health = this.level * 10
    this.skillCooldown = (1 / this.level) * 1000
    this.casting = 0

    try {
      const position = getRandomPosition()
      this.position.copy(position).setY(this.height / 2)
    } catch (error) {
      console.error(error)
      return
    }

    this.castShadow = true
    this.receiveShadow = true
    this.userData = {
      isPersistant: false,
      isSelected: false,
      boundingBox: new THREE.Box3(),
      initialColor: material.color,
      damage: this.damage,
      speed: this.speed,
      health: this.health,
      skillCooldown: this.skillCooldown,
    }

    scene.add(this)
  }

  private freeze(enemies: Enemy[]) {
    console.log(enemies)
  }

  private burn(enemies: Enemy[]) {
    const fireDamage = this.damage
    enemies.forEach(enemy => enemy.takeDamage(fireDamage, this.allyTowerType))
  }

  private toss(enemies: Enemy[]) {
    console.log(enemies)
  }

  private throwback(enemies: Enemy[]) {
    console.log(enemies)
  }

  public startCasting(enemies: Enemy[]) {
    const _ally = this
    const skillMap = {
      [AllyType.WATER]: this.freeze.bind(_ally),
      [AllyType.FIRE]: this.burn.bind(_ally),
      [AllyType.EARTH]: this.toss.bind(_ally),
      [AllyType.AIR]: this.throwback.bind(_ally),
    }
    const skill = skillMap[this.allyTowerType]

    this.casting = setInterval(() => skill(enemies), this.skillCooldown)
  }
}
