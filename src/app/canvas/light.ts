import * as THREE from 'three'
import { scene } from './scene'

export const createAmbientLight = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1) // Soft white light

  ambientLight.userData = { isPersistant: true }

  scene.add(ambientLight)

  return ambientLight
}

export const createDirectionalLight = () => {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)

  directionalLight.position.set(0, 20, -5)

  // Увімкнемо тіні
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 1024
  directionalLight.shadow.mapSize.height = 1024
  directionalLight.shadow.camera.near = 1
  directionalLight.shadow.camera.far = 500
  directionalLight.shadow.camera.left = -7
  directionalLight.shadow.camera.right = 7
  directionalLight.shadow.camera.top = 15
  directionalLight.shadow.camera.bottom = -15

  directionalLight.userData = { isPersistant: true }

  scene.add(directionalLight)

  return directionalLight
}

export const createSpotLight = (target: THREE.Mesh) => {
  const spotLight = new THREE.SpotLight(0xffffff, 2.5, 15, Math.PI / 16, 0.25, 0.5) // Довжина, кут, розсіювання

  spotLight.position.copy(target.position)
  spotLight.position.y = 10
  spotLight.target = target // Сфокусуємо світло на кубі

  // Увімкнемо тіні
  spotLight.castShadow = true
  spotLight.shadow.mapSize.width = 1024
  spotLight.shadow.mapSize.height = 1024

  spotLight.userData = { isPersistant: true }

  scene.add(spotLight)
  scene.add(spotLight.target) // Додаємо target для роботи

  return spotLight
}

export const createPointLight = () => {
  const pointLight = new THREE.PointLight(0xffaa00, 1, 20, 0.75) // Колір, інтенсивність, відстань, згасання

  pointLight.position.set(0, 15, -5)

  // Увімкнемо тіні
  pointLight.castShadow = true
  pointLight.shadow.mapSize.width = 1024
  pointLight.shadow.mapSize.height = 1024

  pointLight.userData = { isPersistant: true }

  scene.add(pointLight)

  // Додаємо невеликий шар як джерело світла для візуалізації
  const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 })
  )

  lightSphere.position.copy(pointLight.position.clone())

  lightSphere.userData = { isPersistant: true }

  scene.add(lightSphere)

  return { pointLight, lightSphere }
}

export const createHemisphereLight = () => {
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x222222, 1) // Небо, земля, інтенсивність

  hemisphereLight.userData = { isPersistant: true }

  scene.add(hemisphereLight)

  return hemisphereLight
}
