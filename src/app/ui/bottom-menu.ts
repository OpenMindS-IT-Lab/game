import { entries } from 'lodash'
import { Ally, AllyType } from '../canvas'
import Game from '../game'
import { toggleTowerInfo } from './tower-info'

export const bottomButtons = document.getElementById('bottom-buttons') as HTMLElement
export const purchaseWaterTowerButton = document.getElementById('purchase-water-tower') as HTMLButtonElement
export const purchaseFireTowerButton = document.getElementById('purchase-fire-tower') as HTMLButtonElement
export const purchaseEarthTowerButton = document.getElementById('purchase-earth-tower') as HTMLButtonElement
export const purchaseAirTowerButton = document.getElementById('purchase-air-tower') as HTMLButtonElement
export const startLevelButton = document.getElementById('start-level-button') as HTMLButtonElement

export const bottomInfo = document.getElementById('bottom-info') as HTMLDivElement
export const levelDisplay = document.getElementById('level-display') as HTMLHeadingElement
export const timer = document.getElementById('timer') as HTMLSpanElement

export function updateBottomButtons(game: Game) {
  const costs = Object.fromEntries(entries(Ally.priceMap).map(([type, prices]) => [type, prices[0]]))
  const coins = game.coins
  const mainTower = game.tower
  const allies = mainTower.allies

  if (allies.water) purchaseWaterTowerButton.disabled = true
  if (allies.fire) purchaseFireTowerButton.disabled = true
  if (allies.earth) purchaseEarthTowerButton.disabled = true
  if (allies.air) purchaseAirTowerButton.disabled = true

  if (coins >= costs[AllyType.WATER] && !allies.water) {
    purchaseWaterTowerButton.disabled = false
    purchaseWaterTowerButton.onclick = () => toggleTowerInfo(AllyType.WATER)
  } else purchaseWaterTowerButton.disabled = true
  if (coins >= costs[AllyType.FIRE] && !allies.fire) {
    purchaseFireTowerButton.disabled = false
    purchaseFireTowerButton.onclick = () => toggleTowerInfo(AllyType.FIRE)
  } else purchaseFireTowerButton.disabled = true
  if (coins >= costs[AllyType.EARTH] && !allies.earth) {
    purchaseEarthTowerButton.disabled = false
    purchaseEarthTowerButton.onclick = () => toggleTowerInfo(AllyType.EARTH)
  } else purchaseEarthTowerButton.disabled = true
  if (coins >= costs[AllyType.AIR] && !allies.air) {
    purchaseAirTowerButton.disabled = false
    purchaseAirTowerButton.onclick = () => toggleTowerInfo(AllyType.AIR)
  } else purchaseAirTowerButton.disabled = true
}
