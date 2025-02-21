import { entries } from 'lodash'
import { Ally, AllyType } from '../canvas'
import Game from '../game'
import { handlePayButtonClick } from './event-handlers'
import { hideTowerInfo, toggleTowerInfo } from './tower-info'

export const bottomButtons = document.getElementById('bottom-buttons') as HTMLElement
export const purchaseMainTowerButton = document.getElementById('purchase-main-tower') as HTMLButtonElement
export const purchaseWaterTowerButton = document.getElementById('purchase-water-tower') as HTMLButtonElement
export const purchaseFireTowerButton = document.getElementById('purchase-fire-tower') as HTMLButtonElement
export const purchaseEarthTowerButton = document.getElementById('purchase-earth-tower') as HTMLButtonElement
export const purchaseAirTowerButton = document.getElementById('purchase-air-tower') as HTMLButtonElement
export const purchaseCoinsButton = document.getElementById('purchase-coins') as HTMLButtonElement
export const startLevelButton = document.getElementById('start-level-button') as HTMLButtonElement

export const bottomInfo = document.getElementById('bottom-info') as HTMLDivElement
export const levelDisplay = document.getElementById('level-display') as HTMLHeadingElement
export const timer = document.getElementById('timer') as HTMLSpanElement

purchaseCoinsButton.onclick = handlePayButtonClick

export function updateShop(game: Game) {
  const coins = game.coins
  const mainTower = game.tower
  const allies = mainTower.allies
  const costs = Object.fromEntries(
    entries(Ally.priceMap).map(([type, prices]) => {
      let price = prices[0]
      const ally = allies[type as AllyType]

      if (!!ally) {
        price = ally.upgradeCost
      }

      return [type, price]
    })
  )

  if (allies.water) purchaseWaterTowerButton.disabled = true
  if (allies.fire) purchaseFireTowerButton.disabled = true
  if (allies.earth) purchaseEarthTowerButton.disabled = true
  if (allies.air) purchaseAirTowerButton.disabled = true
  if (mainTower) purchaseMainTowerButton.disabled = true

  if (coins >= mainTower.upgradeCost) {
    purchaseMainTowerButton.disabled = false
    purchaseMainTowerButton.onclick = () => toggleTowerInfo(mainTower)
  }
  if (coins >= costs[AllyType.WATER]) {
    purchaseWaterTowerButton.disabled = false
    purchaseWaterTowerButton.onclick = () => toggleTowerInfo(!!allies.water ? allies.water : AllyType.WATER)
  } else purchaseWaterTowerButton.disabled = true
  if (coins >= costs[AllyType.FIRE]) {
    purchaseFireTowerButton.disabled = false
    purchaseFireTowerButton.onclick = () => toggleTowerInfo(!!allies.fire ? allies.fire : AllyType.FIRE)
  } else purchaseFireTowerButton.disabled = true
  if (coins >= costs[AllyType.EARTH]) {
    purchaseEarthTowerButton.disabled = false
    purchaseEarthTowerButton.onclick = () => toggleTowerInfo(!!allies.earth ? allies.earth : AllyType.EARTH)
  } else purchaseEarthTowerButton.disabled = true
  if (coins >= costs[AllyType.AIR]) {
    purchaseAirTowerButton.disabled = false
    purchaseAirTowerButton.onclick = () => toggleTowerInfo(!!allies.air ? allies.air : AllyType.AIR)
  } else purchaseAirTowerButton.disabled = true
}

export const shop = document.getElementById('shop') as HTMLElement
export const shopButton = document.getElementById('shop-button') as HTMLButtonElement
export const closeShopButton = document.getElementById('close-shop-button') as HTMLButtonElement

export function toggleShop() {
  if (shop.classList.contains('hidden')) {
    // const mainTower = scene.getObjectByName('Tower') as Tower
    const game = Game.__inst

    if (game) updateShop(game)

    hideTowerInfo()
  }

  shop.classList.toggle('hidden')
}

shopButton.onclick = toggleShop
closeShopButton.onclick = () => {
  if (!shop.classList.contains('hidden')) {
    toggleShop()
  }
}
