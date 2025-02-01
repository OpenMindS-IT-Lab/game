export const gameContainer = document.getElementById('game-container') as HTMLDivElement
export const uiContainer = document.getElementById('ui-container') as HTMLDivElement
// Додаємо логіку для меню
export const menuToggle = document.getElementById('burger-button') as HTMLButtonElement
export const sideMenu = document.getElementById('side-menu') as HTMLElement
export const closeButton = document.getElementById('close-button') as HTMLButtonElement
export const pauseButton = document.getElementById('pause-button') as HTMLButtonElement
export const resumeButton = document.getElementById('resume-button') as HTMLButtonElement

export const spawnFatButton = document.getElementById('spawn-fat') as HTMLButtonElement
export const spawnFastButton = document.getElementById('spawn-fast') as HTMLButtonElement
export const spawnRegularButton = document.getElementById('spawn-regular') as HTMLButtonElement
export const spawnStrongButton = document.getElementById('spawn-strong') as HTMLButtonElement

export const gameInfoTableBody = document.querySelector('#game-info-table tbody') as HTMLTableSectionElement

export const coinCounter = document.getElementById('coin-counter') as HTMLDivElement
export const scoreCounter = document.getElementById('score-counter') as HTMLDivElement
export const highscoreCounter = document.getElementById('highscore-counter') as HTMLDivElement

export function toggleMenu() {
  sideMenu.classList.toggle('hidden') // Відкриваємо/закриваємо меню
}

// closeButton.addEventListener('click', toggleMenu)
// menuToggle.addEventListener('click', toggleMenu)

export * from './event-listeners'
export * from './info-table'
