import { capitalize, values } from 'lodash'
import * as THREE from 'three'
import airTowerImg from '../assets/air-tower.png'
import earthTowerImg from '../assets/earth-tower.png'
import fireTowerImg from '../assets/fire-tower.png'
import waterTowerImg from '../assets/water-tower.png'
import Game from '../game'
import * as textures from '../textures'
import { toggleTowerInfo } from '../ui/tower-info'
import { float, showDamageText, Timeout } from '../utils'
import { moveAndFlip, moveLinear } from './animations'
import EnemySpawner, { Enemy } from './enemies'
import renderer from './renderer'
import { scene } from './scene'
import { tiles } from './tiles'
import Tower from './tower'

export const enum AllyType {
  WATER = 'water',
  FIRE = 'fire',
  EARTH = 'earth',
  AIR = 'air',
}

export class Ally extends THREE.Mesh {
  __game?: Game

  title: string
  description: string
  image: string
  level: number = 0
  health: number = 0
  maxHealth: number = 0
  damage: number = 0
  speed: number = 0
  cooldown: number = 0
  upgradeCost: number = 0

  particles?: {
    pause(): void
    resume(): void
  }

  allyTowerType: AllyType
  isSelected: boolean = false
  height: number
  casting: Timeout

  private static loadTexture<T extends AllyType>(
    type: T,
    settingsCB?: (texture: textures.Texture<T>) => textures.Texture<T>
  ): textures.Texture<T> | {} {
    if (type in textures) {
      const loader = new THREE.TextureLoader()
      const textureData = textures[type] as textures.TextureData<T extends AllyType.FIRE ? T : undefined>

      const colorTexture = loader.load(textureData.color)
      const normalTexture = loader.load(textureData.normalGL)
      const roughnessTexture = loader.load(textureData.roughness)
      const displacementTexture = loader.load(textureData.displacement)
      const aoTexture =
        type !== AllyType.FIRE ? loader.load((textureData as textures.TextureData).ambientOcclusion) : undefined
      const metalinessTexture =
        type === AllyType.FIRE
          ? loader.load((textureData as textures.TextureData<AllyType.FIRE>).metaliness)
          : undefined

      try {
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
        colorTexture.anisotropy = maxAnisotropy
      } catch (error) {
        console.warn(error)
      }
      colorTexture.premultiplyAlpha = false

      colorTexture.wrapS = THREE.RepeatWrapping
      colorTexture.wrapT = THREE.RepeatWrapping
      colorTexture.repeat.set(7.5, 4.5)

      normalTexture.wrapS = THREE.RepeatWrapping
      normalTexture.wrapT = THREE.RepeatWrapping
      normalTexture.repeat.set(7.5, 4.5)
      normalTexture.format = THREE.RGBAFormat
      normalTexture.flipY = false
      normalTexture.premultiplyAlpha = false

      roughnessTexture.wrapS = THREE.RepeatWrapping
      roughnessTexture.wrapT = THREE.RepeatWrapping
      roughnessTexture.repeat.set(7.5, 4.5)

      if (aoTexture) {
        aoTexture.wrapS = THREE.RepeatWrapping
        aoTexture.wrapT = THREE.RepeatWrapping
        aoTexture.repeat.set(7.5, 4.5)
      }

      if (metalinessTexture) {
        metalinessTexture.wrapS = THREE.RepeatWrapping
        metalinessTexture.wrapT = THREE.RepeatWrapping
        metalinessTexture.repeat.set(7.5, 4.5)
      }

      displacementTexture.wrapS = THREE.RepeatWrapping
      displacementTexture.wrapT = THREE.RepeatWrapping
      displacementTexture.repeat.set(7.5, 4.5)

      const texture = {
        map: colorTexture,
        normalMap: normalTexture,
        roughnessMap: roughnessTexture,
        displacementMap: displacementTexture,
      }

      if (aoTexture) Object.assign(texture, { aoMap: aoTexture })
      if (metalinessTexture) Object.assign(texture, { metalinessMap: metalinessTexture })

      return typeof settingsCB === 'function' ? settingsCB(texture as textures.Texture<T>) : texture
    }

    return {}
  }

  private static textureMap = {
    [AllyType.WATER]: Ally.loadTexture<AllyType.WATER>(AllyType.WATER, texture => {
      values(texture).forEach(({ repeat }) => repeat.set(2, 0.5))
      return texture
    }),
    [AllyType.FIRE]: Ally.loadTexture<AllyType.FIRE>(AllyType.FIRE, texture => {
      values(texture).forEach(({ repeat }) => repeat.set(2.5, 1.5))
      return texture
    }),
    [AllyType.EARTH]: Ally.loadTexture<AllyType.EARTH>(AllyType.EARTH, texture => {
      values(texture).forEach(({ repeat }) => repeat.set(0.75, 0.75))
      return texture
    }),
    [AllyType.AIR]: Ally.loadTexture<AllyType.AIR>(AllyType.AIR, texture => {
      values(texture).forEach(({ repeat }) => repeat.set(5, 1))
      return texture
    }),
  }

  private static geometryMap = {
    [AllyType.WATER]: () => new THREE.SphereGeometry(0.75, 16, 16),
    [AllyType.FIRE]: () => new THREE.OctahedronGeometry(0.9).rotateY(Math.PI / 4),
    [AllyType.EARTH]: () => new THREE.BoxGeometry(1.25, 1.25, 1.25),
    [AllyType.AIR]: () => new THREE.IcosahedronGeometry(0.9, 0),
  }

  private static materialMap = {
    [AllyType.WATER]: {
      // color: 0x4277ff,
      // transparent: true,
      // opacity: 0.8,
      // roughness: 0.5,
      // metalness: 0,
      // emissive: 0x4277ff,
      // emissiveIntensity: 0.25,
      displacementScale: 0.01,
      normalScale: new THREE.Vector2(10, 10),
    },
    [AllyType.FIRE]: {
      // color: 0xff4444,
      // transparent: true,
      // opacity: 1,
      // roughness: 0.1,
      // metalness: 0,
      // emissive: 0xff4444,
      // emissiveIntensity: 0.1,
      displacementScale: 0.01,
      normalScale: new THREE.Vector2(10, 10),
    },
    [AllyType.EARTH]: {
      // color: 0x423333,
      // transparent: true,
      // opacity: 1,
      // roughness: 1,
      // metalness: 0,
      // emissive: 0x424242,
      // emissiveIntensity: 0.25,
      displacementScale: 0.01,
      normalScale: new THREE.Vector2(10, 10),
    },
    [AllyType.AIR]: {
      // color: 0x42ffff,
      // transparent: true,
      // opacity: 0.7,
      // roughness: 0.2,
      // metalness: 0,
      // emissive: 0x42ffff,
      // emissiveIntensity: 0.25,
      displacementScale: 0,
      normalScale: new THREE.Vector2(10, 10),
    },
  }

  private static heightMap = {
    [AllyType.WATER]: 1.5,
    [AllyType.FIRE]: 1.8,
    [AllyType.EARTH]: 1.25,
    [AllyType.AIR]: 1.8,
  }

  private static embers() {
    const ally = this as unknown as Ally
    const emberCount = 200
    const emberGeometry = new THREE.BufferGeometry()
    const emberPositions = new Float32Array(emberCount * 3)

    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3] = (Math.random() - 0.5) * 1.25 // x
      emberPositions[i * 3 + 1] = (Math.random() - 0.5) * ally.height // y
      emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.25 // z
    }

    emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3))

    const emberMaterial = new THREE.PointsMaterial({
      color: 0xff4500,
      size: 0.07,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const embers = new THREE.Points(emberGeometry, emberMaterial)
    embers.position.copy(ally.position)
    embers.visible = false
    scene.add(embers)

    const animateEmbers = () => {
      const animate = () => {
        if (!embers.visible) return

        const positions = emberGeometry.attributes.position.array

        for (let i = 0; i < emberCount; i++) {
          positions[i * 3 + 1] += ally.damage / 60 // Move upward

          // Reset ember position
          if (positions[i * 3 + 1] > 2) {
            positions[i * 3 + 1] = 0
          }
        }

        emberGeometry.attributes.position.needsUpdate = true

        requestAnimationFrame(animate)
      }

      animate()

      return {
        pause() {
          embers.visible = false
        },
        resume() {
          embers.visible = true
          animate()
        },
      }
    }

    return animateEmbers()
  }

  private static droplets() {
    const ally = this as unknown as Ally
    const dropletCount = 150
    const dropletGeometry = new THREE.BufferGeometry()
    const dropletPositions = new Float32Array(dropletCount * 3)

    for (let i = 0; i < dropletCount; i++) {
      dropletPositions[i * 3] = (Math.random() - 0.5) * 1.25 // x
      dropletPositions[i * 3 + 1] = Math.random() * 1.25 + ally.height // y
      dropletPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.25 // z
    }

    dropletGeometry.setAttribute('position', new THREE.BufferAttribute(dropletPositions, 3))

    const dropletMaterial = new THREE.PointsMaterial({
      color: 0x00bfff,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const droplets = new THREE.Points(dropletGeometry, dropletMaterial)
    droplets.position.copy(ally.position)
    droplets.visible = false
    scene.add(droplets)

    const animateDroplets = () => {
      const animate = () => {
        if (!droplets.visible) return

        const positions = dropletGeometry.attributes.position.array

        for (let i = 0; i < dropletCount; i++) {
          positions[i * 3 + 1] -= ally.damage / 20 // Move downward

          // Reset droplet position
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = Math.random() * 2 + 2
          }
        }
        dropletGeometry.attributes.position.needsUpdate = true

        requestAnimationFrame(animate)
      }

      animate()

      return {
        pause() {
          droplets.visible = false
        },
        resume() {
          droplets.visible = true
          animate()
        },
      }
    }

    return animateDroplets()
  }

  private static dust() {
    const ally = this as unknown as Ally
    const dustCount = 200
    const dustGeometry = new THREE.BufferGeometry()
    const dustPositions = new Float32Array(dustCount * 3)

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 1.25 // x
      dustPositions[i * 3 + 1] = Math.random() * ally.height + 0.5 // y
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.25 // z
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))

    const dustMaterial = new THREE.PointsMaterial({
      color: 0x1e0e01,
      size: 0.1,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })

    const dust = new THREE.Points(dustGeometry, dustMaterial)
    dust.position.copy(ally.position)
    dust.visible = false
    scene.add(dust)

    const jiggle = (position: number) => {
      const addition = ((Math.random() - 0.5) * ally.speed) / 20
      const sum = position + addition
      return Math.abs(sum) >= 1 ? 0 : sum
    }

    const animateDust = () => {
      const animate = () => {
        if (!dust.visible) return

        const positions = dustGeometry.attributes.position.array

        for (let i = 0; i < dustCount; i++) {
          positions[i * 3] = jiggle(positions[i * 3]) // x
          positions[i * 3 + 1] = jiggle(positions[i * 3 + 1]) // y
          positions[i * 3 + 2] = jiggle(positions[i * 3 + 2]) // z
        }
        dustGeometry.attributes.position.needsUpdate = true

        requestAnimationFrame(animate)
      }

      animate()

      return {
        pause() {
          dust.visible = false
        },
        resume() {
          dust.visible = true
          animate()
        },
      }
    }

    return animateDust()
  }

  private static swirlies() {
    const ally = this as unknown as Ally
    const airCount = 150
    const airGeometry = new THREE.BufferGeometry()
    const airPositions = new Float32Array(airCount * 3)

    for (let i = 0; i < airCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random()
      airPositions[i * 3] = Math.cos(angle) * radius // x
      airPositions[i * 3 + 1] = Math.random() * (ally.height / 2) - 1 // y
      airPositions[i * 3 + 2] = Math.sin(angle) * radius // z
    }

    airGeometry.setAttribute('position', new THREE.BufferAttribute(airPositions, 3))

    const airMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const swirlies = new THREE.Points(airGeometry, airMaterial)
    swirlies.position.copy(ally.position)
    swirlies.visible = false
    scene.add(swirlies)

    const animateSwirlies = () => {
      const animate = () => {
        if (!swirlies.visible) return

        const positions = airGeometry.attributes.position.array
        const speed = ally.speed / 20 // Adjust speed as needed

        for (let i = 0; i < airCount; i++) {
          const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3])
          const radius = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 2] * positions[i * 3 + 2])

          // Increment the angle for circular motion
          const newAngle = angle + speed

          positions[i * 3] = Math.cos(newAngle) * radius // x
          positions[i * 3 + 1] += 0.01 // Move upward
          positions[i * 3 + 2] = Math.sin(newAngle) * radius // z

          // Reset particle if it goes too high
          if (positions[i * 3 + 1] >= ally.height / 2) {
            positions[i * 3 + 1] = 0
          }
        }

        airGeometry.attributes.position.needsUpdate = true

        requestAnimationFrame(animate)
      }

      animate()

      return {
        pause() {
          swirlies.visible = false
        },
        resume() {
          swirlies.visible = true
          animate()
        },
      }
    }

    return animateSwirlies()
  }

  private static particlesMap = {
    [AllyType.AIR]: Ally.swirlies,
    [AllyType.WATER]: Ally.droplets,
    [AllyType.EARTH]: Ally.dust,
    [AllyType.FIRE]: Ally.embers,
  }

  static priceMap = {
    [AllyType.AIR]: [10, 20, 100, 200, 1000, 2000, 10000, 20000, 50000, 100000, 1000000, 2000000],
    [AllyType.WATER]: [15, 30, 150, 300, 1500, 3000, 15000, 30000, 100000, 200000, 1000000, 2000000],
    [AllyType.EARTH]: [20, 40, 200, 400, 2000, 4000, 20000, 40000, 150000, 300000, 1000000, 2000000],
    [AllyType.FIRE]: [25, 50, 250, 500, 2500, 5000, 25000, 50000, 200000, 400000, 1000000, 2000000],
  }

  static descriptionMap = {
    [AllyType.AIR]:
      'Command the skies with the Air Tower, sending a powerful gust that knocks all enemies back, displacing them. This tower ensures you control the battlefield, disrupting enemy formations with each pulse.',
    [AllyType.WATER]:
      "Freeze your foes in their tracks with the Water Tower, launching chilling blasts that immobilize the nearest enemy. This tower's icy grip ensures no enemy escapes its frosty hold.",
    [AllyType.EARTH]:
      "Invoke the might of the Earth Tower as it hurls the nearest enemy into the air, causing them to crash back down with a force that deals damage. This tower's raw power will shake the very ground beneath your enemies' feet.",
    [AllyType.FIRE]:
      "Set the battlefield ablaze with the Fire Tower, igniting all enemies within range and dealing damage with searing flames. Watch as foes are engulfed in fire, their ranks left smoldering in the tower's wake.",
  }

  static imageMap = {
    [AllyType.WATER]: waterTowerImg,
    [AllyType.FIRE]: fireTowerImg,
    [AllyType.EARTH]: earthTowerImg,
    [AllyType.AIR]: airTowerImg,
  }

  private static getRandomPosition() {
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

  static calcDamage(level: number, type?: AllyType) {
    const basicDamage = float(level / 2 + 0.5 * level)
    switch (type) {
      case AllyType.EARTH:
        return float(basicDamage * 3)
      case AllyType.WATER:
      case AllyType.AIR:
        return float(basicDamage / 3)
      default:
        return basicDamage
    }
  }

  static calcSpeed(level: number) {
    return float(level / 4)
  }
  static calcSkillCooldown(level: number) {
    return float(2000 / level)
  }

  static calcHealth(health: number, level: number) {
    return health + (level - 1 || 1) * 10
  }

  constructor(type: AllyType) {
    const geometry = Ally.geometryMap[type]()
    const material = new THREE.MeshStandardMaterial({
      ...Ally.materialMap[type],
      ...Ally.textureMap[type],
    })

    try {
      if (material.map) material.map.anisotropy = renderer.capabilities.getMaxAnisotropy()
    } catch (error) {
      console.warn(error)
    }

    super(geometry, material)

    this.title = capitalize(type) + ' Tower'
    this.description = Ally.descriptionMap[type]
    this.image = Ally.imageMap[type]

    this.allyTowerType = type
    this.height = Ally.heightMap[type]

    this.level = 0
    this.levelUp()

    this.casting = 0

    try {
      const position = Ally.getRandomPosition()
      this.position.copy(position).setY(this.height / 2)
    } catch (error) {
      console.error(error)
      return
    }

    this.castShadow = true
    this.receiveShadow = true

    this.userData = {
      isPersistant: false,
      boundingBox: new THREE.Box3(),
      initialColor: material.color,
    }

    this.particles = Ally.particlesMap[type].bind(this)()

    scene.add(this)
  }

  updatePrice(priceMap: typeof Ally.priceMap = Ally.priceMap) {
    this.upgradeCost = priceMap[this.allyTowerType][this.level]
  }

  levelUp() {
    this.level += 1
    this.health = Ally.calcHealth(this.health, this.level)
    this.maxHealth = this.health
    this.damage = Ally.calcDamage(this.level, this.allyTowerType)
    this.speed = Ally.calcSpeed(this.level)
    this.cooldown = Ally.calcSkillCooldown(this.level)
  }

  previewUpgrade() {
    const level = this.level + 1
    const health = Ally.calcHealth(this.health, this.level + 1)
    const damage = Ally.calcDamage(this.level + 1, this.allyTowerType)
    const speed = Ally.calcSpeed(this.level + 1)
    const cooldown = Ally.calcSkillCooldown(this.level + 1)

    return {
      level,
      health,
      damage,
      speed,
      cooldown,
    }
  }

  select() {
    const tower = scene.getObjectByName('Tower') as Tower
    // if (tower.isSelected) tower.unselect()
    tower.unselectAllies()
    tower.unselect()
    if (this.particles) this.particles.resume()
    // ;(this.material as THREE.MeshStandardMaterial).color.set(Colors.SELECTED_TOWER.color)
    // ;(this.material as THREE.MeshStandardMaterial).emissiveIntensity = 0
    this.isSelected = true
    toggleTowerInfo(this)
  }

  unselect() {
    // ;(this.material as THREE.MeshStandardMaterial).color.set(Ally.materialMap[this.allyTowerType].color)
    // ;(this.material as THREE.MeshStandardMaterial).emissiveIntensity =
    // Ally.materialMap[this.allyTowerType].emissiveIntensity
    if (this.particles && this.__game?.isUpgrading) this.particles.pause()
    this.isSelected = false
    toggleTowerInfo()
  }

  private getNearestEnemy(enemies: Enemy[]) {
    if (!enemies.length) return false

    const towerPosition = this.position.clone()

    const nearestEnemy =
      enemies
        .filter(({ userData: { isAnimating } }) => !isAnimating.currentState)
        .sort(({ position: a }, { position: b }) => a.distanceTo(towerPosition) - b.distanceTo(towerPosition))[0] ??
      null

    if (!nearestEnemy) return false

    nearestEnemy.spawner.purgeDestroyedEnemies()
    return nearestEnemy
  }

  private freeze(enemies: Enemy[]) {
    const nearestEnemy = this.getNearestEnemy(
      enemies.filter(enemy => !enemy.userData.isAnimating.currentState && enemy.moving)
    )

    if (!nearestEnemy) return

    nearestEnemy.userData.isAnimating.switchState(true)
    nearestEnemy.stop()

    const freezed = setTimeout(() => {
      if (!nearestEnemy) {
        clearTimeout(freezed)
        return
      }
      nearestEnemy.userData.isAnimating.switchState(false)
      nearestEnemy.spawner.purgeDestroyedEnemies()
      nearestEnemy.moving = nearestEnemy.move()
    }, this.damage * 1000)
  }

  public takeDamage(damage: number, spawner: EnemySpawner) {
    const tower = scene.getObjectByName('Tower') as Tower
    if (!tower) return

    this.health -= damage
    showDamageText(damage, this.position, 0xff0000)

    if (this.health <= 0) {
      this.stopCasting()
      scene.remove(this)

      const occupiedTile = tiles
        .filter(tile => tile.userData.isOccupied && tile.position.z === 14)
        .find(tile => tile.position.x === this.position.x)
      if (occupiedTile) occupiedTile.userData.isOccupied = false

      spawner.purgeDestroyedEnemies()

      spawner.enemies
        .filter(enemy => !enemy.userData.isDestroyed && !enemy.userData.isAnimating.currentState)
        .forEach(enemy => {
          enemy.stop()
        })

      tower.allies[this.allyTowerType] = undefined

      spawner.enemies
        .filter(enemy => !enemy.userData.isAnimating.currentState && !enemy.userData.isDestroyed && !enemy.moving)
        .forEach(enemy => {
          enemy.moving = enemy.move()
        })
    }
  }

  private burn(enemies: Enemy[]) {
    enemies
      .filter(enemy => !enemy.userData.isDestroyed)
      .forEach(enemy => {
        const fireDamage = this.damage

        enemy.takeDamage(fireDamage, this.allyTowerType)

        for (let i = 0; i <= this.level; i++) {
          setTimeout(() => {
            if (!enemy.userData.isDestroyed) enemy.takeDamage(float(fireDamage / (i + 1)), this.allyTowerType, true)
          }, this.cooldown * (i + 1))
        }
      })
  }

  private toss(enemies: Enemy[]) {
    const nearestEnemy = this.getNearestEnemy(enemies)

    if (!nearestEnemy) return
    const earthDamage = this.damage

    nearestEnemy.stop()
    moveAndFlip(nearestEnemy, nearestEnemy.position.clone(), nearestEnemy.userData.isAnimating, undefined, () => {
      nearestEnemy.takeDamage(earthDamage, this.allyTowerType)
      if (nearestEnemy.health >= 0) nearestEnemy.move()
    })
  }

  private throwback(enemies: Enemy[]) {
    enemies
      .filter(
        enemy =>
          !enemy.userData.isAnimating.currentState &&
          !enemy.userData.isDestroyed &&
          enemy.position.z >= -12 &&
          -5 <= enemy.position.x &&
          enemy.position.x <= 5
      )
      .forEach(enemy => {
        enemy.stop()
        enemy.userData.isAnimating.switchState(true)
        const enemyPostion = enemy.position.clone().setZ(enemy.position.z - this.damage)
        moveLinear(
          enemy,
          enemyPostion,
          enemy.userData.isAnimating.switchState,
          () => {
            enemy.move()
          },
          Math.max(1, 1 / this.damage)
        )
      })
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

    this.casting = setInterval(() => skill(enemies), this.cooldown)
    if (this.particles) this.particles.resume()
  }

  public stopCasting() {
    clearInterval(this.casting)
    if (this.particles) this.particles.pause()
    this.casting = 0
  }
}
