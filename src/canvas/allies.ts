import * as THREE from 'three'

export function spawnAlly(scene: THREE.Scene) {
  const geometry = new THREE.BoxGeometry(1, 2, 1) // Форма союзника
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }) // Зелений союзник
  const ally = new THREE.Mesh(geometry, material)

  ally.position.set(
    Math.random() * 10 - 5, // Випадкова позиція
    1,
    Math.random() * 10 - 5
  )

  ally.castShadow = true
  ally.receiveShadow = true

  ally.userData = { isAlly: true } // Позначаємо об'єкт як союзника
  scene.add(ally)
}

export function upgradeAllies(scene: THREE.Scene) {
  scene.traverse(object => {
    if (object.userData.isAlly) {
      object.scale.multiplyScalar(1.2) // Збільшуємо союзника
      ;((object as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(0x00ffff) // Змінюємо колір
    }
  })
}
