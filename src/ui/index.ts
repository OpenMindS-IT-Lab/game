// Додаємо логіку для меню
export const menuToggle = document.getElementById('burger-button') as Element
export const sideMenu = document.getElementById('side-menu') as Element
export const closeButton = document.getElementById('close-button') as Element

export const spawnFatButton = document.getElementById('spawn-fat') as Element
export const spawnFastButton = document.getElementById('spawn-fast') as Element
export const spawnRegularButton = document.getElementById('spawn-regular') as Element
export const spawnStrongButton = document.getElementById('spawn-strong') as Element

export const spawnWaterTowerButton = document.getElementById('spawn-water-tower') as Element
export const spawnFireTowerButton = document.getElementById('spawn-fire-tower') as Element
export const spawnEarthTowerButton = document.getElementById('spawn-earth-tower') as Element
export const spawnAirTowerButton = document.getElementById('spawn-air-tower') as Element

export const resetSceneButton = document.getElementById('reset-scene') as Element

export function toggleMenu() {
  sideMenu.classList.toggle('hidden') // Відкриваємо/закриваємо меню
  console.log('here')
}

closeButton.addEventListener('click', toggleMenu)
menuToggle.addEventListener('click', toggleMenu)
