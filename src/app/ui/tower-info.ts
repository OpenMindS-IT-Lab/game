import { capitalize } from 'lodash'
import { Ally, AllyType, scene } from '../canvas'
import Tower from '../canvas/tower'
import { updateBottomButtons } from './bottom-menu'

const towerInfoContainer = document.getElementById('tower-info') as HTMLElement
const towerInfo = towerInfoContainer.children.namedItem('content') as HTMLElement
//
const towerTitle = towerInfo.children.namedItem('title') as HTMLHeadingElement
const towerInfoContent = towerInfo.children.namedItem('content') as HTMLDivElement
//
const towerImageContainer = towerInfoContent.children.namedItem('image') as HTMLDivElement
const towerImageElement = towerImageContainer.querySelector('img') as HTMLImageElement
//
const towerHealthBar = towerInfoContent.children.namedItem('health-bar') as HTMLDivElement
const healthBar = towerHealthBar.querySelector('progress') as HTMLProgressElement
const healthValue = towerHealthBar.querySelector('span') as HTMLSpanElement
//
const towerDescription = towerInfoContent.children.namedItem('description') as HTMLParagraphElement
//
const towerStats = towerInfoContent.children.namedItem('stats') as HTMLDivElement
const statsTable = towerStats.children.namedItem('stats-table') as HTMLTableElement
const towerLevel = statsTable.querySelector('[name="level"]') as HTMLTableCellElement
const towerHealth = statsTable.querySelector('[name="health"]') as HTMLTableCellElement
const towerAttackSpeed = statsTable.querySelector('[name="attack-speed"]') as HTMLTableCellElement
const towerDamage = statsTable.querySelector('[name="damage"]') as HTMLTableCellElement
const towerCooldown = statsTable.querySelector('[name="cooldown"]') as HTMLTableCellElement

const nextTowerLevel = statsTable.querySelector('[name="next-level"]') as HTMLTableCellElement
const nextTowerHealth = statsTable.querySelector('[name="next-health"]') as HTMLTableCellElement
const nextTowerAttackSpeed = statsTable.querySelector('[name="next-attack-speed"]') as HTMLTableCellElement
const nextTowerDamage = statsTable.querySelector('[name="next-damage"]') as HTMLTableCellElement
const nextTowerCooldown = statsTable.querySelector('[name="next-cooldown"]') as HTMLTableCellElement

const towerUpgradeCost = towerStats.children.namedItem('upgrade-cost') as HTMLSpanElement
//
const upgradeTowerButton = towerInfo.children.namedItem('upgrade-button') as HTMLButtonElement
const closeButton = towerInfo.children.namedItem('close-button') as HTMLButtonElement

const updateTable = (tower: Tower | Ally) => {
  const game = tower.__game!
  const { title, description, level, health, speed, damage, cooldown, upgradeCost } = tower

  towerTitle.innerText = title
  towerDescription.innerText = description
  towerLevel.innerText = level.toString()
  towerHealth.innerText = health.toString()
  towerAttackSpeed.innerText = speed + 's'
  towerDamage.innerText = damage.toString()
  towerCooldown.innerText = cooldown + 'ms'

  const next = tower.previewUpgrade()

  nextTowerLevel.innerText = next.level.toString()
  nextTowerHealth.innerText = next.health.toString()
  nextTowerAttackSpeed.innerText = next.speed + 's'
  nextTowerDamage.innerText = next.damage.toString()
  nextTowerCooldown.innerText = next.cooldown + 'ms'

  towerUpgradeCost.innerHTML = `<strong>Upgrade Cost: </strong>${upgradeCost} Coins`

  healthBar.max = tower.maxHealth
  healthBar.value = tower.health
  healthValue.innerText = `${tower.health} / ${tower.maxHealth}`

  towerImageElement.src = tower.image
  towerImageElement.alt = tower.title

  statsTable.querySelectorAll('td:last-of-type').forEach(td => td.classList.remove('hidden'))
  statsTable.querySelectorAll('th:last-of-type').forEach(th => th.classList.remove('hidden'))

  if (!game.isUpgrading) upgradeTowerButton.disabled = true
  else upgradeTowerButton.disabled = false
  upgradeTowerButton.innerText = 'Upgrade'
  upgradeTowerButton.onclick = () => {
    game.levelUp(tower)
    updateTable(tower)
  }

  closeButton.onclick = () => {
    tower.unselect()
    hideTowerInfo()
  }

  updateBottomButtons(game)
}

export function hideTowerInfo() {
  towerInfoContainer.classList.replace('visible', 'hidden')

  towerTitle.innerText = ''
  towerDescription.innerText = ''
  towerLevel.innerText = ''
  towerHealth.innerText = ''
  towerAttackSpeed.innerText = ''
  towerDamage.innerText = ''
  towerCooldown.innerText = ''

  towerUpgradeCost.innerHTML = '<strong>Upgrade Cost: </strong>0 Coins'

  healthBar.max = 100
  healthBar.value = 0
  healthValue.innerText = ''

  towerImageElement.src = '#'
  towerImageElement.alt = 'Tower'

  upgradeTowerButton.innerText = 'Upgrade'
  upgradeTowerButton.onclick = () => void 0

  statsTable.querySelectorAll('td:last-of-type').forEach(td => td.classList.remove('hidden'))
  statsTable.querySelectorAll('th:last-of-type').forEach(th => th.classList.remove('hidden'))

  closeButton.onclick = () => void 0
}

export function toggleTowerInfo(tower?: Tower | Ally | AllyType) {
  if (!tower && towerInfoContainer.classList.contains('visible')) hideTowerInfo()
  if (tower instanceof Tower || tower instanceof Ally) {
    if (towerInfoContainer.classList.contains('hidden')) towerInfoContainer.classList.replace('hidden', 'visible')
    updateTable(tower)
  } else if (!!tower) {
    if (towerInfoContainer.classList.contains('hidden')) towerInfoContainer.classList.replace('hidden', 'visible')
    const mainTower = scene.getObjectByName('Tower') as Tower
    const game = mainTower.__game!

    const title = capitalize(tower) + ' Tower'
    const level = 1
    const health = Ally.calcHealth(0, level)

    towerTitle.innerText = title
    towerDescription.innerText = Ally.descriptionMap[tower]
    towerImageElement.src = Ally.imageMap[tower]
    towerImageElement.alt = title

    healthBar.max = health
    healthBar.value = health
    healthValue.innerText = `${health} / ${health}`

    towerLevel.innerText = level.toString()
    towerHealth.innerText = health.toString()
    towerAttackSpeed.innerText = Ally.calcSpeed(level) + 's'
    towerDamage.innerText = Ally.calcDamage(level).toString()
    towerCooldown.innerText = Ally.calcSkillCooldown(level) + 'ms'

    towerUpgradeCost.innerHTML = `<strong>Purchase Cost: </strong>${Ally.priceMap[tower][0]} Coins`

    statsTable.querySelectorAll('td:last-of-type').forEach(td => td.classList.add('hidden'))
    statsTable.querySelectorAll('th:last-of-type').forEach(th => th.classList.add('hidden'))

    if (!game.isUpgrading) upgradeTowerButton.disabled = true
    else upgradeTowerButton.disabled = false
    upgradeTowerButton.innerText = 'Purchase'
    upgradeTowerButton.onclick = () => {
      const newTower = game!.purchase(tower)

      if (newTower) {
        newTower.startCasting(game.spawner.enemies)
        newTower.select()
        updateTable(newTower)
      }
    }

    closeButton.onclick = () => {
      hideTowerInfo()
    }
  }
}
