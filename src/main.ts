import * as THREE from 'three'

// Тип для контейнера
const gameContainer: HTMLElement | null = document.getElementById('game-container')
if (!gameContainer) throw new Error('Game container not found')

// Сцена, камера, рендерер
const scene: THREE.Scene = new THREE.Scene()

// Перспективна камера
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  75, // Кут огляду (Field of View)
  window.innerWidth / window.innerHeight, // Співвідношення сторін
  0.1, // Ближня межа видимості
  1000 // Дальня межа видимості
)

// Камера (згори)
camera.position.set(2, 15, 2) // Камера трохи піднята
camera.lookAt(0, 0, 0) // Дивиться на центр сцени

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
gameContainer.appendChild(renderer.domElement)

// Освітлення
const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(10, 20, 10)
scene.add(light)

// Прості геометричні об'єкти
const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(2, 2, 2)
const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x2194ce })
const cube: THREE.Mesh = new THREE.Mesh(geometry, material)
scene.add(cube)

// Анімація
function animate(): void {
  requestAnimationFrame(animate)
  // cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  // cube.rotation.z += 0.01
  renderer.render(scene, camera)
}
animate()

// Адаптація розміру
window.addEventListener('resize', (): void => {
  camera.aspect = window.innerWidth / window.innerHeight // Оновлення співвідношення
  camera.updateProjectionMatrix() // Перерахунок матриці
  renderer.setSize(window.innerWidth, window.innerHeight)
})
