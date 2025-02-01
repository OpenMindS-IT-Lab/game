import * as THREE from 'three'
import textureAmbientOcclusion from '../assets/ground-texture/AmbientOcclusion.jpg'
import textureColor from '../assets/ground-texture/Color.jpg'
import textureDisplacement from '../assets/ground-texture/Displacement.jpg'
import textureNormalGL from '../assets/ground-texture/NormalGL.jpg'
import textureRoughness from '../assets/ground-texture/Roughness.jpg'
import { scene } from './scene'

const createGround = (renderer: THREE.WebGLRenderer) => {
  const gridHelper = new THREE.GridHelper(70, 35, 0x444444, 0x111111)
  gridHelper.userData = { isPersistant: true }
  gridHelper.visible = false
  scene.add(gridHelper)

  const textureLoader = new THREE.TextureLoader()

  const colorTexture = textureLoader.load(textureColor)
  const normalTexture = textureLoader.load(textureNormalGL)
  const roughnessTexture = textureLoader.load(textureRoughness)
  const aoTexture = textureLoader.load(textureAmbientOcclusion)
  const displacementTexture = textureLoader.load(textureDisplacement)

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  colorTexture.anisotropy = maxAnisotropy
  colorTexture.premultiplyAlpha = false

  colorTexture.wrapS = THREE.RepeatWrapping
  colorTexture.wrapT = THREE.RepeatWrapping
  colorTexture.repeat.set(7.5, 4.5)

  normalTexture.wrapS = THREE.RepeatWrapping
  normalTexture.wrapT = THREE.RepeatWrapping
  normalTexture.repeat.set(7.5, 4.5)
  normalTexture.format = THREE.RGBAFormat
  normalTexture.flipY = false
  normalTexture.premultiplyAlpha = false

  roughnessTexture.wrapS = THREE.RepeatWrapping
  roughnessTexture.wrapT = THREE.RepeatWrapping
  roughnessTexture.repeat.set(7.5, 4.5)

  aoTexture.wrapS = THREE.RepeatWrapping
  aoTexture.wrapT = THREE.RepeatWrapping
  aoTexture.repeat.set(7.5, 4.5)

  displacementTexture.wrapS = THREE.RepeatWrapping
  displacementTexture.wrapT = THREE.RepeatWrapping
  displacementTexture.repeat.set(7.5, 4.5)

  const planeGeometry = new THREE.PlaneGeometry(120, 80, 240, 160)
  planeGeometry.setAttribute('uv2', new THREE.BufferAttribute(planeGeometry.attributes.uv.array, 2))

  const planeMaterial = new THREE.MeshStandardMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    aoMap: aoTexture,
    displacementMap: displacementTexture,
    displacementScale: 0.15, // Adjust this value to control the intensity
  })

  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.1
  plane.userData = { isPersistant: true }
  scene.add(plane)

  return { gridHelper, plane }
}

export default createGround
