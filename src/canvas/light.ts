import * as THREE from 'three'

export const createAmbienLight = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // М'яке біле освітлення

  ambientLight.userData = { isPersistant: true }

  scene.add(ambientLight)

  return ambientLight
}

export const createDirectionalLight = (scene: THREE.Scene) => {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)

  directionalLight.position.set(0, 20, -5)

  // Увімкнемо тіні
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 1024
  directionalLight.shadow.mapSize.height = 1024
  directionalLight.shadow.camera.near = 1
  directionalLight.shadow.camera.far = 500
  directionalLight.shadow.camera.left = -50
  directionalLight.shadow.camera.right = 50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50

  directionalLight.userData = { isPersistant: true }

  scene.add(directionalLight)

  return directionalLight
}

export const createSpotLight = (scene: THREE.Scene, target: THREE.Mesh) => {
  const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 6, 0.5, 2) // Довжина, кут, розсіювання

  spotLight.position.set(10, 20, 10)
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

export const createPointLight = (scene: THREE.Scene) => {
  const pointLight = new THREE.PointLight(0xffaa00, 1, 20, 2) // Колір, інтенсивність, відстань, згасання

  pointLight.position.set(0, 10, 10)

  // Увімкнемо тіні
  pointLight.castShadow = true
  pointLight.shadow.mapSize.width = 512
  pointLight.shadow.mapSize.height = 512

  pointLight.userData = { isPersistant: true }

  scene.add(pointLight)

  // Додаємо невеликий шар як джерело світла для візуалізації
  const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  )

  lightSphere.position.copy(pointLight.position)

  lightSphere.userData = { isPersistant: true }

  scene.add(lightSphere)

  return { pointLight, lightSphere }
}

export const createHemisphereLight = (scene: THREE.Scene) => {
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x222222, 0.8) // Небо, земля, інтенсивність

  hemisphereLight.userData = { isPersistant: true }

  scene.add(hemisphereLight)

  return hemisphereLight
}
