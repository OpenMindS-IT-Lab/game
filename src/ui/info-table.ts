import EnemySpawner from '../canvas/enemies'
import Tower from '../canvas/tower'

// Function to update the game info table
function updateGameInfoTable(tower: Tower, spawner: EnemySpawner) {
  const tableBody = document.querySelector('#game-info-table tbody')
  if (!tableBody) return

  // Clear existing rows
  tableBody.innerHTML = ''

  // Add Allies data
  const alliesHeading = document.createElement('tr')
  alliesHeading.innerHTML = `
    <th colspan="5">Allies</th>
  `

  // Add Tower data
  const towerRow = document.createElement('tr')
  towerRow.innerHTML = `
    <td>Tower</td>
    <td>${tower.health}</td>
    <td>${tower.level}</td>
    <td>${tower.bulletDamage}</td>
    <td>${tower.bulletSpeed}</td>
  `
  tableBody.appendChild(alliesHeading)
  alliesHeading.after(towerRow)

  tower.allies.forEach(ally => {
    const allyRow = document.createElement('tr')
    allyRow.innerHTML = `
    <td>${ally.allyTowerType}</td>
    <td>${ally.health}</td>
    <td>${ally.level}</td>
    <td>${ally.damage}</td>
    <td>${ally.speed}</td>
    `
    tableBody.appendChild(allyRow)
  })

  // Add Enemies data
  const enemiesHeading = document.createElement('tr')
  enemiesHeading.innerHTML = `
    <th colspan="5">Enemies</th>
  `
  tableBody.appendChild(enemiesHeading)

  spawner.enemies.forEach(enemy => {
    const enemyRow = document.createElement('tr')
    enemyRow.innerHTML = `
    <td>${enemy.userData.type}</td>
    <td>${enemy.userData.health}</td>
    <td>${spawner.level}</td>
    <td>${enemy.userData.damage}</td>
    <td>${enemy.userData.speed}</td>
    `
    tableBody.appendChild(enemyRow)
  })
}

export default function renderInfoTable(tower: Tower, spawner: EnemySpawner) {
  const infoTableUpdateI = setInterval(() => {
    // console.log(spawner.intervals)
    updateGameInfoTable(tower, spawner)
    if (spawner.intervals.length === 0 && spawner.enemies.length === 0) clearInterval(infoTableUpdateI)
  }, 1000 / 4 )

  return () => {
    clearInterval(infoTableUpdateI)
  }
}
