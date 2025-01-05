// Додаємо логіку для меню
export const menuToggle = document.getElementById('burger-button') as Element
export const sideMenu = document.getElementById('side-menu') as Element
export const closeButton = document.getElementById('close-button') as Element
export const pauseButton = document.getElementById('pause-button') as Element
export const resumeButton = document.getElementById('resume-button') as Element

export const spawnFatButton = document.getElementById('spawn-fat') as Element
export const spawnFastButton = document.getElementById('spawn-fast') as Element
export const spawnRegularButton = document.getElementById('spawn-regular') as Element
export const spawnStrongButton = document.getElementById('spawn-strong') as Element

export const upgradeMainTowerButton = document.getElementById('upgrade-main-tower') as Element

export const bottomButtons = document.getElementById('bottom-buttons') as Element
export const upgradeWaterTowerButton = document.getElementById('upgrade-water-tower') as Element
export const upgradeFireTowerButton = document.getElementById('upgrade-fire-tower') as Element
export const upgradeEarthTowerButton = document.getElementById('upgrade-earth-tower') as Element
export const upgradeAirTowerButton = document.getElementById('upgrade-air-tower') as Element
export const startLevelButton = document.getElementById('start-level-button') as Element

export const bottomInfo = document.getElementById('bottom-info') as Element
export const levelDisplay = document.getElementById('level-display') as Element
export const timer = document.getElementById('timer') as Element

export const gameInfoTableBody = document.querySelector('#game-info-table tbody') as Element

export const coinCounter = document.getElementById('coin-counter') as Element
export const scoreCounter = document.getElementById('score-counter') as Element

export function toggleMenu() {
  sideMenu.classList.toggle('hidden') // Відкриваємо/закриваємо меню
}

closeButton.addEventListener('click', toggleMenu)
menuToggle.addEventListener('click', toggleMenu)
