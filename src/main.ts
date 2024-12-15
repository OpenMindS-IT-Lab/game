import * as THREE from 'three'

// Тип для контейнера
const gameContainer: HTMLElement | null = document.getElementById('game-container')
if (!gameContainer) throw new Error('Game container not found')

// Сцена, камера, рендерер
const scene: THREE.Scene = new THREE.Scene()

// Перспективна камера
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  85, // Кут огляду (Field of View)
  window.innerWidth / window.innerHeight, // Співвідношення сторін
  0.1, // Ближня межа видимості
  1000 // Дальня межа видимості
)

// Камера (згори)
camera.position.set(0, 15, 0) // Камера трохи піднята
camera.lookAt(0, 0, 0) // Дивиться на центр сцени

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
gameContainer.appendChild(renderer.domElement)

// Освітлення
const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, 200, -50)
scene.add(light)

// Colors
const tileColor = { color: 0xff4444, transparent: true, opacity: 0 }
const cubeColor = { color: 0x2194ce }
const selectedCubeColor = { color: 0x00ff28 }

// Граунд
const gridHelper = new THREE.GridHelper(30, 15, 0x444444, 0x111111)
gridHelper.position.set(0, 0, 0)
scene.add(gridHelper)

const planeGeometry = new THREE.PlaneGeometry(14, 30)
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -Math.PI / 2
plane.position.y = -0.01
scene.add(plane)

// Ігрові плитки
const tiles: THREE.Mesh[] = []
const tileSize = 2

for (let x = -3; x <= 3; x++) {
  for (let z = -7; z <= 7; z++) {
    const tileGeometry = new THREE.BoxGeometry(tileSize, 0, tileSize)
    const tileMaterial = new THREE.MeshStandardMaterial(tileColor)
    const tile = new THREE.Mesh(tileGeometry, tileMaterial)

    tile.position.set(x * tileSize, 0, z * tileSize)
    tile.userData.active = false
    tiles.push(tile)
    scene.add(tile)
  }
}

// Прості геометричні об'єкти
const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(2, 2, 2)
const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial(cubeColor)
const cube: THREE.Mesh = new THREE.Mesh(geometry, material)
cube.position.set(0, 0, 0)
cube.userData.isSelected = false
scene.add(cube)

// Raycaster для кліків
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Анімація
// 1. Ініціалізація змінних
let isAnimating = false // Щоб уникнути повторної анімації

// Animation
// 2. Функція для запуску анімації
function startAnimation(object: THREE.Mesh, position?: THREE.Vector3): void {
  isAnimating = true // Блокування повторного запуску

  const initialX = object.position.x // Початкова висота
  const initialY = object.position.y // Початкова висота
  const initialZ = object.position.z // Початкова висота
  const initialRotationX = object.rotation.x
  const initialRotationZ = object.rotation.z
  let elapsed = 0 // Час, який минув

  // Анімація за допомогою requestAnimationFrame
  function animate(): void {
    const frameTime = 0.0128
    elapsed += frameTime // Змінюємо час для обчислення нової позиції

    // Стрибок: синусоїдальний рух
    object.position.y = initialY + Math.sin(elapsed * Math.PI) * 3

    // Обертання
    object.rotation.x += 0.04
    object.rotation.z -= 0.04

    if (position) {
      object.position.x += (position.x - initialX) * frameTime
      object.position.z += (position.z - initialZ) * frameTime
    }

    // Якщо анімація завершена (стрибок повернувся вниз)
    if (elapsed >= 1) {
      console.log(object.position.x, position?.x)

      object.position.y = initialY // Вирівнюємо висоту
      object.position.round()
      object.rotation.x = initialRotationX
      object.rotation.z = initialRotationZ
      isAnimating = false // Розблокування
      return
    }

    // Продовження анімації
    requestAnimationFrame(animate)
  }

  animate() // Запускаємо анімацію
}

function animateDemo(): void {
  requestAnimationFrame(animateDemo)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
}
//* animateDemo()

function render() {
  requestAnimationFrame(render)
  renderer.render(scene, camera)
}

render()

// Адаптація розміру
window.addEventListener('resize', (): void => {
  camera.aspect = window.innerWidth / window.innerHeight // Оновлення співвідношення
  camera.updateProjectionMatrix() // Перерахунок матриці
  renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener('click', (event: MouseEvent): void => {
  if (isAnimating) return // Пропускаємо, якщо анімація вже йде

  // Визначення позиції миші
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // Визначення перетинів
  raycaster.setFromCamera(mouse, camera)
  let intersects = raycaster.intersectObject(cube) // Задаємо, по якому об'єкту перевіряємо

  const switchObjectSelectionState = (object: THREE.Mesh) => {
    object.material = object.userData.isSelected
      ? new THREE.MeshStandardMaterial(cubeColor)
      : new THREE.MeshStandardMaterial(selectedCubeColor)
    object.userData.isSelected = !object.userData.isSelected
  }

  if (intersects.length > 0) switchObjectSelectionState(intersects[0].object as THREE.Mesh)
  else {
    intersects = raycaster.intersectObjects(tiles)

    if (intersects.length > 0) {
      const tile = intersects[0].object as THREE.Mesh

      if (cube.userData.isSelected) {
        startAnimation(cube, tile.position)
        switchObjectSelectionState(cube)
      }
    }
  }
})

window.addEventListener('mousemove', (event: MouseEvent): void => {
  // Обчислення позиції миші в нормалізованих координатах
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // Визначення об'єктів, над якими знаходиться курсор
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(tiles)

  // Якщо є перетин із плиткою, курсор стає pointer
  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer'
  } else {
    document.body.style.cursor = 'default'
  }
})
