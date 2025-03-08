import { compact, values } from 'lodash';
import * as THREE from 'three';
import mainTowerImg from '../assets/main-tower.png';
import Game from '../game';
import { toggleTowerInfo } from '../ui/tower-info';
import { showDamageText } from '../utils';
import { Ally, AllyType } from './allies';
import { Colors } from './constants';
import EnemySpawner, { Enemy } from './enemies';
import loader from './model-loader';
import { scene } from './scene';

class Tower extends THREE.Mesh {
  title?: string
  description?: string
  image?: string
  initialMaterial?: THREE.Material
  isSelected: boolean = false
  health: number = 0
  maxHealth: number = 0
  level: number = 0
  speed: number = 0
  damage: number = 0
  cooldown: number = 0
  upgradeCost: number = 0
  shooting: Timeout = 0
  allies: Record<AllyType, Ally | undefined> = {
    [AllyType.EARTH]: undefined,
    [AllyType.AIR]: undefined,
    [AllyType.FIRE]: undefined,
    [AllyType.WATER]: undefined,
  }

  private priceMap: number[] = [
    5, 10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 12000, 16000, 40000, 80000, 120000, 160000, 400000, 800000,
    1200000, 1600000,
  ]

  constructor(size: number = 1) {
    super()
    this.initializeProperties();
    this.loadModel(size);
  }

  private initializeProperties() {
    this.title = 'Main Tower';
    this.description =
      'Unleash the precision of the Main Tower as it methodically targets the nearest enemy, firing with deadly accuracy and inflicting massive damage. This reliable sentinel stands as the cornerstone of your defenses.';
    this.image = mainTowerImg;
    this.isSelected = false;
    this.health = 0;
    this.maxHealth = 0;
    this.level = 0;
    this.speed = 0;
    this.damage = 0;
    this.cooldown = 0;
    this.upgradeCost = 0;
    this.shooting = 0;
    this.allies = {
      [AllyType.EARTH]: undefined,
      [AllyType.AIR]: undefined,
      [AllyType.FIRE]: undefined,
      [AllyType.WATER]: undefined,
    };
  }

  private loadModel(size: number) {
    loader.load(
      '/app/models/main-tower.glb',
      gltf => {
        this.setupModel(gltf.scene, size);
      },
      progress => console.log('Loading glTF model: ', progress),
      err => console.error(err)
    );
  }

  private setupModel(gltf: THREE.Group, size: number) {
    console.log('Object loaded: ', gltf);
    this.copy(gltf.children[0]);

    const material = (this.material as THREE.MeshStandardMaterial);
    material.setValues({ wireframe: true });

    this.initialMaterial = material.clone();
    this.name = 'Tower';
    this.receiveShadow = true;
    this.castShadow = true;

    this.position.set(0, 0, 14);
    this.rotateY(Math.PI);
    this.scale.setY(size);

    this.userData = {
      isSelected: false,
      isPersistant: true,
      boundingBox: new THREE.Box3(),
      initialColor: Colors.TOWER,
      health: this.health,
    };

    this.levelUp();
    scene.add(this);
  }

  select() {
    this.unselectAllies()
    ;(this.material as THREE.MeshStandardMaterial).color.set(Colors.SELECTED_TOWER.color)
    ;(this.material as THREE.MeshStandardMaterial).emissiveIntensity = 0
    this.isSelected = true
    toggleTowerInfo(this)
  }

  unselect() {
    this.initialMaterial && (this.material as THREE.MeshStandardMaterial).copy(this.initialMaterial)
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
    return this.maxHealth + level * 10;
  }
  
  private calcSpeed(level: number) {
    return parseFloat(Math.max((level - 3) / (level > 6 ? 10 : 6), 0.1).toFixed(2));
  }
  
  private calcDamage(level: number) {
    return parseFloat((level * 0.75 + 0.5 * level).toFixed(2));
  }
  
  private calcCooldown(level: number) {
    return parseFloat((4000 / Math.max(level * 2, 1)).toFixed(2));
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
    const updatedPrices: Record<AllyType, number[]> = Object.fromEntries(
      Object.entries(Ally.priceMap).map(([type, prices]) => [
        type as AllyType,
        prices.map(price => Math.round(price + score / totalUpgrades))
      ])
    ) as Record<AllyType, number[]>;

    Object.values(this.allies).forEach(ally => {
      if (ally) ally.updatePrice(updatedPrices);
    });
  }

  heal() {
    this.health = this.maxHealth
    values(this.allies).forEach(ally => {
      if (ally) ally.health = ally.maxHealth
    })
  }

  private attack(enemy: Enemy): void {
    const projectile = new Projectile(this.position.clone(), this.damage, 0.5, enemy.position.clone().sub(this.position).normalize());
    projectile.shoot();
  }

  private shootAtNearestEnemy(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const nearestEnemy = enemies.reduce((closest: Enemy | null, enemy) => {
      if (enemy.userData.isDestroyed) return closest;
      if (!closest || enemy.position.distanceTo(this.position) < closest.position.distanceTo(this.position)) {
        return enemy;
      }
      return closest;
    }, null);

    if (!nearestEnemy) return;

    this.attack(nearestEnemy);
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
      scene.remove(this)
    }
  }

  public spawnAlly(type: AllyType) {
    const newAlly = new Ally(type)
    this.allies[type] = newAlly
    return newAlly
  }

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
    const geometry = new THREE.SphereGeometry(0.1, 16, 16)
    const material = new THREE.MeshStandardMaterial({
      color: Colors.TOWER.color,
      metalness: 1,
      roughness: 0.1,
    })
    super(geometry, material)

    this.position.copy(position).setY(0.5)
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

  shoot() {
    const animateBullet = () => {
      this.position.addScaledVector(this.direction, this.speed)

      if (this.position.distanceTo(this.initialPosition) > 50) {
        scene.remove(this)
        return
      }

      requestAnimationFrame(animateBullet)
    }

    animateBullet()
  }
}
