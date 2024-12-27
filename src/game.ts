import EnemySpawner from './canvas/enemies'
import Tower from './canvas/tower'
import { coinCounter } from './ui'

export default class Game {
  _coins: number = 0
  spawner: EnemySpawner
  tower: Tower
  isRunning: boolean
  isPaused: boolean
  isOver: boolean

  get coins() {
    return this._coins
  }

  // TODO: Економіка покупки башень (2 левел = 10 монет)
  set coins(amount: number) {
    this._coins = amount

    coinCounter.innerHTML = `Coins: ${amount}`
  }

  constructor(spawner: EnemySpawner, tower: Tower) {
    this.spawner = spawner
    this.tower = tower
    this.isRunning = false
    this.isPaused = false
    this.isOver = false

    this.spawner.collectDrop = this.spawner.collectDrop.bind(this)
  }

  public start() {
    try {
      this.spawner.start()
      this.tower.startShooting(this.spawner.enemies)
    } catch (error) {
      console.error(error)
      return
    }

    this.isRunning = true
  }

  public pause() {
    try {
      //! this.spawner.pause()
      this.tower.stopShooting()
    } catch (error) {
      console.error(error)
      return
    }

    this.isPaused = true
  }

  public resume() {
    try {
      //! this.spawner.resume
      this.tower.startShooting(this.spawner.enemies)
    } catch (error) {
      console.error(error)
      return
    }

    this.isPaused = false
  }

  public end() {
    try {
      this.spawner.stop()
      this.tower.stopShooting()
    } catch (error) {
      console.error(error)
      return
    }

    this.isRunning = false
    this.isPaused = false
    this.isOver = true

    console.log(`Total coins: ${this.coins}`)
  }
}
