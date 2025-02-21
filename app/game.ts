import { keys, values } from 'lodash'
// import { WebAppInitData } from 'telegram-webapps'
import { TelegramWebApps } from 'telegram-webapps'
import api from './api'
import { scene } from './canvas'
import { Ally, AllyType } from './canvas/allies'
import EnemySpawner from './canvas/enemies'
import Tower from './canvas/tower'
import { coinCounter, highscoreCounter, scoreCounter } from './ui'
import { bottomButtons, bottomInfo, levelDisplay, timer } from './ui/bottom-menu'
import { upgradeTowerButton } from './ui/tower-info'
import { handleMinorError } from './utils'

export enum PaidItem {
  CoinsS = 'cs',
  CoinsM = 'cm',
  CoinsL = 'cl',
  CoinsXL = 'cx',
  ExtraLife = 'el',
}

export type CoinsPack = Exclude<PaidItem, PaidItem.ExtraLife>

export default class Game {
  protected _coins: number = 0
  protected _score: number = 0
  protected _highscore: number = 0
  protected _totalUpgrades: number = 0

  protected _onLevelStart: () => void = () => void 0
  protected _onLevelComplete: () => void = () => void 0

  public static user?: Partial<TelegramWebApps.WebAppInitData['user']>
  public static webAppData?: Partial<Omit<TelegramWebApps.WebAppInitData, 'user' | 'hash'>>
  public static coinsPackMap = {
    [PaidItem.CoinsS]: 35,
    [PaidItem.CoinsM]: 85,
    [PaidItem.CoinsL]: 185,
    [PaidItem.CoinsXL]: 885,
  }

  addPurchasedItem(item: PaidItem) {
    console.log('Purchased item: ', item)

    const addCoins = (amount: number) => {
      this.coins += amount
    }

    const upgradeCoinsPack = (multiplier: number) => {
      console.log('Coins pack multiplier: ', multiplier)

      keys(Game.coinsPackMap).forEach(pack => {
        Game.coinsPackMap[pack as CoinsPack] *= Math.pow(1.25, multiplier)
      })
    }

    let multiplier = 0
    switch (item) {
      case PaidItem.CoinsS:
        multiplier += 1
        console.log('S1')
      case PaidItem.CoinsM:
        multiplier += 1
        console.log('S2')
      case PaidItem.CoinsL:
        multiplier += 1
        console.log('S3')
      case PaidItem.CoinsXL:
        multiplier += 1
        console.log('S4')
        addCoins(Game.coinsPackMap[item])
        upgradeCoinsPack(multiplier)
        break
      case PaidItem.ExtraLife:
      default:
        break
    }
  }

  public static __inst: Game

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
    this._coins = Math.round(amount)
    coinCounter.innerText = `Coins: ${Math.round(amount)}`
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

    // this.coins += 1000000

    if (!Telegram.WebApp.initData)
      Telegram.WebApp.showAlert('Launched from KeyboardButton! Unsupported!', () => Telegram.WebApp.close())
    else {
      api.validate(Telegram.WebApp.initData).then(async validData => {
        const { user, ...webAppData } = validData

        if (user) Game.user = user
        if (webAppData) Game.webAppData = webAppData

        await this.initStorage(validData)
      }, handleMinorError)
    }

    Game.__inst = this
  }

  protected async initStorage(initData: TelegramWebApps.WebAppInitData) {
    try {
      const { user: userData, ...webAppInitData } = initData
      const transactions = await api.getStarTransactions()

      console.log('WebApp init data:')
      console.table(webAppInitData)
      console.log('User data:')
      console.table(userData)
      console.log('Transactions: ', transactions)

      Telegram.WebApp.requestWriteAccess(accessGranted => console.log('Is write access granted: ', accessGranted))

      Telegram.WebApp.CloudStorage.getKeys((error, keys) => {
        if (error) throw error
        if (keys.length === 0) Telegram.WebApp.CloudStorage.setItem('highscore', `${0}`)
        else
          Telegram.WebApp.CloudStorage.getItem('highscore', (error, highscore) => {
            if (error) throw error
            if (highscore && !Number.isNaN(parseInt(highscore))) {
              this._highscore = parseInt(highscore)
              highscoreCounter.innerHTML = `Highscore: ${this.highscore}`
            }
          })
      })

      if (Telegram.WebApp.isVerticalSwipesEnabled) Telegram.WebApp.disableVerticalSwipes()
      if (!Telegram.WebApp.isOrientationLocked) Telegram.WebApp.lockOrientation()
      if (!Telegram.WebApp.isClosingConfirmationEnabled) Telegram.WebApp.enableClosingConfirmation()
      if (process.env.NODE_ENV !== 'development' && !Telegram.WebApp.isFullscreen) Telegram.WebApp.requestFullscreen()
      // alert(Telegram.WebApp.platform)
      Telegram.WebApp.ready()
    } catch (error) {
      handleMinorError(error)
    }
  }

  public levelUp(allyTower: Tower | Ally) {
    if (!this.isUpgrading) return

    if (this.coins - allyTower.upgradeCost >= 0) {
      this.coins -= allyTower.upgradeCost
      this.totalUpgrades += 1

      allyTower.levelUp()

      if (!(allyTower instanceof Tower)) this.tower.updateAlliesPriceMap(this.score, this.totalUpgrades)

      upgradeTowerButton.disabled = this.coins < allyTower.upgradeCost

      // updateShop(this)
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

      upgradeTowerButton.disabled = this.coins < newAlly.upgradeCost

      // updateShop(this)
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
          // updateShop(this)
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

    Telegram.WebApp.showAlert('GAME OVER!', () => {
      this.reset()
    })
    // console.log(`Total coins: ${this.coins}`)
  }

  reset() {
    this.coins = 0
    this.score = 0
    this.totalUpgrades = 0
    this.level = 0
    this.spawner.enemies.forEach(enemy => enemy.destroy())
    this.tower.level = 1

    values(this.tower.allies).forEach(ally => {
      if (!!ally) scene.remove(ally)
    })
    this.tower.allies.water = undefined
    this.tower.allies.air = undefined
    this.tower.allies.fire = undefined
    this.tower.allies.earth = undefined

    scene.add(this.tower)
  }
}
