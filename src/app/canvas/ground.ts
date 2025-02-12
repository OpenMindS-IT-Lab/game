import * as THREE from 'three'
import { ground as texture } from '../textures'
import { scene } from './scene'

const createGround = (renderer: THREE.WebGLRenderer) => {
  const gridHelper = new THREE.GridHelper(70, 35, 0x444444, 0x111111)
  gridHelper.userData = { isPersistant: true }
  gridHelper.visible = false
  scene.add(gridHelper)

  const textureLoader = new THREE.TextureLoader()

  const colorTexture = textureLoader.load(texture.color)
  const normalTexture = textureLoader.load(texture.normalGL)
  const roughnessTexture = textureLoader.load(texture.roughness)
  const aoTexture = textureLoader.load(texture.ambientOcclusion)
  const displacementTexture = textureLoader.load(texture.displacement)

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  const repeat = new THREE.Vector2(30, 18)

  colorTexture.anisotropy = maxAnisotropy
  colorTexture.premultiplyAlpha = false

  colorTexture.wrapS = THREE.RepeatWrapping
  colorTexture.wrapT = THREE.RepeatWrapping
  colorTexture.repeat.set(repeat.x, repeat.y)

  normalTexture.wrapS = THREE.RepeatWrapping
  normalTexture.wrapT = THREE.RepeatWrapping
  normalTexture.repeat.set(repeat.x, repeat.y)
  normalTexture.format = THREE.RGBAFormat
  normalTexture.flipY = false
  normalTexture.premultiplyAlpha = false

  roughnessTexture.wrapS = THREE.RepeatWrapping
  roughnessTexture.wrapT = THREE.RepeatWrapping
  roughnessTexture.repeat.set(repeat.x, repeat.y)

  aoTexture.wrapS = THREE.RepeatWrapping
  aoTexture.wrapT = THREE.RepeatWrapping
  aoTexture.repeat.set(repeat.x, repeat.y)

  displacementTexture.wrapS = THREE.RepeatWrapping
  displacementTexture.wrapT = THREE.RepeatWrapping
  displacementTexture.repeat.set(repeat.x, repeat.y)

  const planeGeometry = new THREE.PlaneGeometry(120, 80, 240, 160)
  planeGeometry.setAttribute('uv2', new THREE.BufferAttribute(planeGeometry.attributes.uv.array, 2))

  const planeMaterial = new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    displacementMap: displacementTexture,
    displacementScale: 0.2, // Adjust this value to control the intensity
    normalScale: repeat.divideScalar(1.5),
  })

  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.1
  plane.userData = { isPersistant: true }
  scene.add(plane)

  return { gridHelper, plane }
}

export default createGround
