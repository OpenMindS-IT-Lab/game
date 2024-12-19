// Додаємо логіку для меню
export const menuToggle = document.getElementById('burger-button') as Element
export const sideMenu = document.getElementById('side-menu') as Element
export const closeButton = document.getElementById('close-button') as Element

export const spawnCubeButton = document.getElementById('spawn-cube') as Element
export const spawnSphereButton = document.getElementById('spawn-sphere') as Element
export const spawnOctahedronButton = document.getElementById('spawn-octahedron') as Element
export const spawnIcosahedronButton = document.getElementById('spawn-icosahedron') as Element

export const resetSceneButton = document.getElementById('reset-scene') as Element

export function toggleMenu() {
  sideMenu.classList.toggle('hidden') // Відкриваємо/закриваємо меню
  console.log('here')
}

closeButton.addEventListener('click', toggleMenu)
menuToggle.addEventListener('click', toggleMenu)
