import { remove } from 'lodash'
import Game from '../game'
import { Enemy, EnemyType } from './enemy'

export default class EnemySpawner {
  private _enemies: Enemy[] = []
  public get enemies() {
    return this._enemies
  }
  set enemies(enemies: Enemy[]) {
    this._enemies = enemies
  }

  level: number
  spawnRate: number
  private lastSpawnTime: number = 0
  private animationFrame: number | null = null
  private isPaused: boolean = false

  constructor() {
    this.enemies = []
    this.level = 1
    this.spawnRate = this.calculateSpawnRate()
    this.spawnEnemy = this.spawnEnemy.bind(this)
  }

  private calculateSpawnRate(): number {
    const dividend = 3000
    const divisor = this.level / 2 <= 1 ? 1 : this.level / 2
    return Math.round(dividend / divisor)
  }

  public collectDrop(coins: number) {
    Game.__inst.coins += coins
  }

  public addScore(score: number) {
    Game.__inst.score += score
  }

  spawnEnemy(type?: EnemyType) {
    const newEnemy = new Enemy(type, this)
    this.enemies.push(newEnemy)
    newEnemy.move()
    newEnemy.watchCollisions()
    return newEnemy
  }

  purgeDestroyedEnemies() {
    remove(this.enemies, ({ userData }) => userData.isDestroyed)
  }

  // Individual spawn functions for each enemy type
  spawnFat() {
    return this.spawnEnemy(EnemyType.FAT)
  }

  spawnFast() {
    return this.spawnEnemy(EnemyType.FAST)
  }

  spawnRegular() {
    return this.spawnEnemy()
  }

  spawnStrong() {
    return this.spawnEnemy(EnemyType.STRONG)
  }

  spawnRandomEnemy() {
    const _spawner = this
    const EnemiesMap = {
      0: this.spawnFat.bind(_spawner),
      1: this.spawnFast.bind(_spawner),
      2: this.spawnStrong.bind(_spawner),
      3: this.spawnRegular.bind(_spawner),
    }

    const randomEnemy =
      EnemiesMap[Math.floor(Math.random() * 4) as keyof typeof EnemiesMap]()
    if (!randomEnemy) throw new Error('Failed to spawn new enemy!')
    return randomEnemy
  }

  private spawnLoop(timestamp: number) {
    if (this.isPaused) return

    if (!this.lastSpawnTime) this.lastSpawnTime = timestamp
    const deltaTime = timestamp - this.lastSpawnTime

    if (deltaTime >= this.spawnRate) {
      this.spawnRandomEnemy()
      this.lastSpawnTime = timestamp
    }

    this.animationFrame = requestAnimationFrame(this.spawnLoop.bind(this))
  }

  public start(level: number) {
    this.level = level
    this.spawnRate = this.calculateSpawnRate()
    this.isPaused = false
    this.lastSpawnTime = 0
    this.animationFrame = requestAnimationFrame(this.spawnLoop.bind(this))
  }

  public stopSpawning() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  public stop() {
    // Only cancel the spawn animation frame, don't pause existing enemies
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  public pause() {
    this.isPaused = true
    this.enemies.forEach(enemy => enemy.stop())
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  public resume() {
    this.isPaused = false
    this.enemies.forEach(enemy => enemy.move())
    this.lastSpawnTime = 0
    this.animationFrame = requestAnimationFrame(this.spawnLoop.bind(this))
  }
}

