import { entries, snakeCase, values } from 'lodash'
import { WebAppInitData } from 'telegram-webapps'
import api from './api'
import { Ally, AllyType } from './canvas/allies'
import EnemySpawner from './canvas/enemies'
import Tower from './canvas/tower'
import { coinCounter, highscoreCounter, scoreCounter } from './ui'
import { bottomButtons, bottomInfo, levelDisplay, timer, updateBottomButtons } from './ui/bottom-menu'
import { handleMinorError } from './utils'
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
export type TelegramUser = {
  id: number
  first_name: string
  last_name: string
  username: string
  language_code: string
  allows_write_to_pm: boolean
  photo_url: string
}

// export type WebAppInitData = {
//   chat_instance: string
//   chat_type: string
//   start_param: string
//   auth_date: string
//   signature: string
//   hash: string
// }

export default class Game {
  _coins: number = 0
  _score: number = 0
  _highscore: number = 0
  _totalUpgrades: number = 0
  _onLevelStart: () => void = () => void 0
  _onLevelComplete: () => void = () => void 0
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

    coinCounter.innerText = `Coins: ${this.coins}`
  }

  get score() {
    return this._score
  }
  set score(value: number) {
    this._score = value

    scoreCounter.innerText = `Score: ${this.score}`
  }

  get highscore() {
    return this._highscore
  }
  set highscore(value: number) {
    Telegram.WebApp.CloudStorage.setItem('highscore', `${value}`, (error, _success) => {
      if (error) console.error(error)
      else {
        // this.highscore = this.score
        console.log('new highscore: ' + value)
        this._highscore = value
        highscoreCounter.innerHTML = `Highscore: ${value}`
        Telegram.WebApp.showAlert('New highscore:\r\n' + value)
      }
    })
  }

  get onLevelStart() {
    return this._onLevelStart
  }
  set onLevelStart(value: () => void) {
    this._onLevelStart = value
  }

  get onLevelComplete() {
    return this._onLevelStart
  }
  set onLevelComplete(value: () => void) {
    this._onLevelStart = value
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
    this.isUpgrading = true
    this.level = 0

    this.coins += 1000

    this.spawner.__game = this
    this.tower.__game = this
  }

  session: string | null = null
  userId: string | null = null

  validateData() {
    api.validate(Telegram.WebApp.initData).then(data => this.initStorage(data))
  }
  private initStorage(initData: WebAppInitData) {
    try {
      const { user: userData, ...webAppInitData } = initData

      // console.log('WebApp init data:')
      // console.table(webAppInitData)
      // console.log('User data:')
      // console.table(userData)

      Telegram.WebApp.CloudStorage.getKeys((error, keys) => {
        if (error) throw error
        if (keys.length === 0) {
          for (let [key, value] of entries(userData)) {
            Telegram.WebApp.CloudStorage.setItem(snakeCase(key), value.toString(), (error, _value) => {
              if (error) throw error
              console.log(`User data saved: ${key}`)
            })
          }
          Telegram.WebApp.CloudStorage.setItem('highscore', `${0}`, (error, _success) => {
            if (error) throw error
          })
        } else {
          Telegram.WebApp.CloudStorage.getItem('active_session', (error, session) => {
            if (error) throw error
            if (session && session !== '') throw new Error('Active session found!')
          })
            .setItem('active_session', webAppInitData.hash, (error, _success) => {
              if (error) throw error
              this.session = webAppInitData.hash
            })
            .getItem('id', (error, id) => {
              if (error) throw error
              this.userId = id
            })
            .getItem('highscore', (error, highscore) => {
              if (error) throw error
              if (highscore && !Number.isNaN(parseInt(highscore))) {
                this._highscore = parseInt(highscore)
                highscoreCounter.innerHTML = `Highscore: ${this.highscore}`
              }
            })
        }
      })
      if (!Telegram.WebApp.isFullscreen) Telegram.WebApp.requestFullscreen()
      if (!Telegram.WebApp.isOrientationLocked) Telegram.WebApp.lockOrientation()
      if (!Telegram.WebApp.isClosingConfirmationEnabled) Telegram.WebApp.enableClosingConfirmation()
      if (Telegram.WebApp.isVerticalSwipesEnabled) Telegram.WebApp.disableVerticalSwipes()
      Telegram.WebApp.ready()
    } catch (error) {
      console.error(error)
      handleMinorError(error)
      return
    }
  }

  public levelUp(allyTower: Tower | Ally) {
    if (!this.isUpgrading) return

    if (this.coins - allyTower.upgradeCost >= 0) {
      // if (allyTower instanceof Tower) {
      //   allyTower.stopShooting()
      // } else {
      //   allyTower.stopCasting()
      // }

      this.coins -= allyTower.upgradeCost
      this.totalUpgrades += 1

      allyTower.levelUp()

      if (allyTower instanceof Tower) {
        // allyTower.startShooting(this.spawner.enemies)
      } else {
        this.tower.updateAlliesPriceMap(this.score, this.totalUpgrades)
        // allyTower.startCasting(this.spawner.enemies)
      }
    } else throw new Error('Not enough coins')
  }

  public purchase(allyType: AllyType) {
    if (!this.isUpgrading) return

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
      this.onLevelStart()

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

          if (this.score > this.highscore) {
            this.highscore = this.score
          }

          this.onLevelComplete()
          updateBottomButtons(this)
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
    if (this.score > this.highscore) this.highscore = this.score

    this.isRunning = false
    this.isPaused = false
    this.isUpgrading = false
    this.isOver = true
    // console.log(`Total coins: ${this.coins}`)
  }
}
