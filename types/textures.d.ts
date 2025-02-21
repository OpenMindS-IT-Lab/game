import type { Texture } from 'three'

type TowerMaterial<T extends AllyType | 'ground' = 'ground'> = {
  map: Texture
  normalMap: Texture
  roughnessMap: Texture
  displacementMap: Texture
} & (T extends 'fire' ? { metalinessMap: Texture } : { aoMap: Texture })

type Data<T extends 'fire' | undefined = undefined> = {
  color: string
  normalGL: string
  roughness: string
  displacement: string
} & (T extends 'fire' ? { metaliness: string } : { ambientOcclusion: string })

export as namespace Textures
