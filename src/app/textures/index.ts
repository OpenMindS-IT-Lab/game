import * as THREE from 'three'
import { AllyType } from '../canvas'

export * as air from './air-tower'
export * as earth from './earth-tower'
export * as fire from './fire-tower'
export * as ground from './ground'
export * as water from './water-tower'

export type Texture<T extends AllyType | 'ground' = 'ground'> = {
  map: THREE.Texture
  normalMap: THREE.Texture
  roughnessMap: THREE.Texture
  displacementMap: THREE.Texture
} & (T extends AllyType.FIRE ? { metalinessMap: THREE.Texture } : { aoMap: THREE.Texture })

export type TextureData<T extends AllyType.FIRE | undefined = undefined> = {
  color: string
  normalGL: string
  roughness: string
  displacement: string
} & (T extends AllyType.FIRE ? { metaliness: string } : { ambientOcclusion: string })
