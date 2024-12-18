// Додаємо логіку для меню
export const menuToggle = document.getElementById('burger-button') as Element
export const sideMenu = document.getElementById('side-menu') as Element
export const closeButton = document.getElementById('close-button') as Element

export function toggleMenu() {
  sideMenu.classList.toggle('hidden') // Відкриваємо/закриваємо меню
  console.log('here')
}

closeButton.addEventListener('click', toggleMenu)
menuToggle.addEventListener('click', toggleMenu)
