import * as THREE from 'three';
import { ground as texture } from '../textures';
import { scene } from './scene';

const createGround = (renderer: THREE.WebGLRenderer, displacementScale: number = 0.1) => {
  const gridHelper = new THREE.GridHelper(70, 35, 0x444444, 0x111111)
  gridHelper.userData = { isPersistant: true }
  gridHelper.visible = false
  scene.add(gridHelper)

  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);

  const textures = {
    color: textureLoader.load(texture.color),
    normal: textureLoader.load(texture.normalGL),
    roughness: textureLoader.load(texture.roughness),
    ao: textureLoader.load(texture.ambientOcclusion),
    displacement: textureLoader.load(texture.displacement),
  };

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  const repeat = new THREE.Vector2(30, 18)

  Object.values(textures).forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat.x, repeat.y);
    tex.flipY = false;
  });

  textures.color.anisotropy = maxAnisotropy;
  // @ts-ignore
  (textures.color as THREE.Texture).encoding = THREE.sRGBEncoding;

  const planeGeometry = new THREE.PlaneGeometry(120, 80, 240, 160)
  planeGeometry.setAttribute('uv2', new THREE.BufferAttribute(planeGeometry.attributes.uv.array, 2))

  const planeMaterial = new THREE.MeshStandardMaterial({
    map: textures.color,
    normalMap: textures.normal,
    roughnessMap: textures.roughness,
    aoMap: textures.ao,
    displacementMap: textures.displacement,
    displacementScale: displacementScale,
    normalScale: repeat,
  })

  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.1
  plane.userData = { isPersistant: true }
  scene.add(plane)

  return { gridHelper, plane, planeMaterial };
}

export default createGround
