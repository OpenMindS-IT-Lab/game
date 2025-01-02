import { Ally, AllyType, upgradesMap } from './canvas/allies'
import EnemySpawner from './canvas/enemies'
import Tower from './canvas/tower'
import { coinCounter, scoreCounter } from './ui'

// function errorBoundary() {
//   return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//     if (descriptor)
//       descriptor.value = () => {
//         try {
//           target()
//         } catch (error) {
//           console.error(error)
//         }
//       }
//   }
// }

export default class Game {
  _coins: number = 0
  _score: number = 0
  #divisor: number = 1
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

  get score() {
    return this._score
  }
  set score(value: number) {
    this._score = value

    scoreCounter.innerHTML = `Score: ${this.score}`
  }

  constructor(spawner: EnemySpawner, tower: Tower) {
    this.spawner = spawner
    this.tower = tower
    this.isRunning = false
    this.isPaused = false
    this.isOver = false

    this.spawner.collectDrop = this.spawner.collectDrop.bind(this)
    this.spawner.addScore = this.spawner.addScore.bind(this)
  }

  public levelUp(allyTower: Tower | Ally) {
    if (this.coins - allyTower.upgradeCost >= 0) {
      if (allyTower.name === 'Tower') {
        ;(allyTower as Tower).stopShooting()
      } else {
        ;(allyTower as Ally).stopCasting()
      }

      this.coins -= allyTower.upgradeCost
      allyTower.levelUp(this.score, this.#divisor)

      if (allyTower.name === 'Tower') {
        this.#divisor += 1
        ;(allyTower as Tower).startShooting(this.spawner.enemies)
      } else {
        this.tower.updateAlliesCosts(this.score, this.#divisor)
        ;(allyTower as Ally).startCasting(this.spawner.enemies)
      }
    } else throw new Error('Not enough coins')
  }

  public purchase(allyType: AllyType) {
    const cost = upgradesMap[allyType][0]

    if (this.coins - cost >= 0) {
      this.coins -= cost
      this.#divisor += 1
      this.tower.updateAlliesCosts(this.score, this.#divisor)
      return this.tower.spawnAlly(allyType)
    } else throw new Error('Not enough coins')
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
