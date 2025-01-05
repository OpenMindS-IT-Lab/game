import { entries } from 'lodash'
import { gameInfoTableBody } from '.'
import EnemySpawner from '../canvas/enemies'
import Tower from '../canvas/tower'

// Function to update the game info table
function updateGameInfoTable(tower: Tower, spawner: EnemySpawner) {
  if (!gameInfoTableBody) return

  // Clear existing rows
  gameInfoTableBody.innerHTML = ''

  // Add Allies data
  const alliesHeading = document.createElement('tr')
  alliesHeading.innerHTML = `
    <th colspan="6">Allies</th>
  `

  // Add Tower data
  const towerRow = document.createElement('tr')
  towerRow.innerHTML = `
    <td>Tower</td>
    <td>${tower.health}</td>
    <td>${tower.level}</td>
    <td>${tower.bulletDamage}</td>
    <td>${tower.bulletSpeed}</td>
    <td>${tower.bulletCooldown}</td>
  `
  gameInfoTableBody.appendChild(alliesHeading)
  alliesHeading.after(towerRow)

  entries(tower.allies).forEach(([_, ally]) => {
    if (ally) {
      const allyRow = document.createElement('tr')
      allyRow.innerHTML = `
      <td>${ally?.allyTowerType}</td>
      <td>${ally?.health}</td>
      <td>${ally?.level}</td>
      <td>${ally?.damage}</td>
      <td>${ally?.speed}</td>
      <td>${ally?.skillCooldown}</td>
      `

      gameInfoTableBody.appendChild(allyRow)
    }
  })

  // Add Enemies data
  const enemiesHeading = document.createElement('tr')
  enemiesHeading.innerHTML = `
    <th colspan="6">Enemies</th>
  `
  gameInfoTableBody.appendChild(enemiesHeading)

  spawner.enemies.forEach(enemy => {
    const enemyRow = document.createElement('tr')
    enemyRow.innerHTML = `
    <td>${enemy.userData.type}</td>
    <td>${enemy.userData.health}</td>
    <td>${enemy.level}</td>
    <td>${enemy.userData.damage}</td>
    <td>${enemy.userData.speed}</td>
    `
    gameInfoTableBody.appendChild(enemyRow)
  })
}

export default function renderInfoTable(tower: Tower, spawner: EnemySpawner) {
  const infoTableUpdateI = setInterval(() => {
    // console.log(spawner.intervals)
    updateGameInfoTable(tower, spawner)
    if (spawner.intervals.length === 0 && spawner.enemies.length === 0) clearInterval(infoTableUpdateI)
  }, 1000 / 4)

  return () => {
    clearInterval(infoTableUpdateI)
  }
}
