import { Ally, AllyType } from './canvas/allies'
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

// TODO: Розділити процес гри на два окремі етапи: проходження рівня та покупка апгрейдів

export default class Game {
  _coins: number = 0
  _score: number = 0
  _totalUpgrades: number = 0
  spawner: EnemySpawner
  tower: Tower
  isRunning: boolean
  isPaused: boolean
  isOver: boolean

  get coins() {
    return this._coins
  }
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

  get totalUpgrades() {
    return this._totalUpgrades
  }
  set totalUpgrades(value: number) {
    this._totalUpgrades = value
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
      if (allyTower instanceof Tower) {
        allyTower.stopShooting()
      } else {
        allyTower.stopCasting()
      }

      this.coins -= allyTower.upgradeCost
      this.totalUpgrades += 1

      allyTower.levelUp()

      if (allyTower instanceof Tower) {
        allyTower.startShooting(this.spawner.enemies)
      } else {
        this.tower.updateAlliesPriceMap(this.score, this.totalUpgrades)
        allyTower.startCasting(this.spawner.enemies)
      }
    } else throw new Error('Not enough coins')
  }

  public purchase(allyType: AllyType) {
    const cost = Ally.priceMap[allyType][0]

    if (this.coins - cost >= 0) {
      this.coins -= cost
      this.totalUpgrades += 1

      const newAlly = this.tower.spawnAlly(allyType)
      this.tower.updateAlliesPriceMap(this.score, this.totalUpgrades)

      return newAlly
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
