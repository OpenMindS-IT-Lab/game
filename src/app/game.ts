import { values } from 'lodash'
import { Ally, AllyType } from './canvas/allies'
import EnemySpawner from './canvas/enemies'
import Tower from './canvas/tower'
import { bottomButtons, bottomInfo, coinCounter, levelDisplay, scoreCounter, timer } from './ui'
// import renderInfoTable from './ui/info-table'

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
  // _coins: number = 10000
  _coins: number = 0
  _score: number = 0
  _totalUpgrades: number = 0
  level: number
  spawner: EnemySpawner
  tower: Tower
  isRunning: boolean
  isPaused: boolean
  isOver: boolean
  isUpgrading: boolean

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
    this.isUpgrading = false
    this.level = 0

    this.spawner.collectDrop = this.spawner.collectDrop.bind(this)
    this.spawner.addScore = this.spawner.addScore.bind(this)
  }

  public levelUp(allyTower: Tower | Ally) {
    if (!this.isUpgrading) return

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
      this.level += 1
      let levelDuration = 30
      levelDisplay.innerHTML = `LEVEL ${this.level}`
      timer.innerHTML = `${levelDuration}`

      bottomButtons.classList.remove('active')
      bottomInfo.classList.add('active')

      this.spawner.start(this.level)
      this.tower.startShooting(this.spawner.enemies)
      values(this.tower.allies).forEach(ally => ally?.startCasting(this.spawner.enemies))
      // const infoTable = renderInfoTable(this.tower, this.spawner)

      this.isUpgrading = false
      this.isRunning = true

      let level = setInterval(() => {
        if (levelDuration) {
          levelDuration--
          timer.innerHTML = `${levelDuration}`
        } else {
          this.stop()
          clearInterval(level)
          // clearInterval(infoTable)
        }
      }, 1000)
    } catch (error) {
      console.error(error)
      return
    }
  }

  stop() {
    try {
      this.spawner.stop()

      let finish = setInterval(() => {
        // console.log('Waiting to finish level')
        // console.log(this.spawner.intervals)
        this.spawner.purgeDestroyedEnemies()

        if (this.spawner.intervals.length === 0) {
          bottomButtons.classList.add('active')
          bottomInfo.classList.remove('active')

          this.tower.stopShooting()
          values(this.tower.allies).forEach(ally => ally?.stopCasting())
          this.tower.heal()

          this.isRunning = false
          this.isUpgrading = true

          clearInterval(finish)
        }
      }, 1000)
    } catch (error) {
      console.error(error)
    }
  }

  public pause() {
    try {
      this.spawner.pause()
      this.tower.stopShooting()
      values(this.tower.allies).forEach(ally => ally?.stopCasting())
    } catch (error) {
      console.error(error)
      return
    }

    this.isPaused = true
  }

  public resume() {
    try {
      this.spawner.resume()
      this.tower.startShooting(this.spawner.enemies)
      values(this.tower.allies).forEach(ally => ally?.startCasting(this.spawner.enemies))
    } catch (error) {
      console.error(error)
      return
    }

    this.isPaused = false
  }

  public end() {
    try {
      // this.spawner.stop()
      this.tower.stopShooting()
    } catch (error) {
      console.error(error)
      return
    }

    this.isRunning = false
    this.isPaused = false
    this.isOver = true

    // console.log(`Total coins: ${this.coins}`)
  }
}
