import * as THREE from 'three'

// Color Definitions
export const Colors = {
  TILE: { color: 0xff4444, transparent: true, opacity: 0 },
  HOVERED_TILE: { color: 0xff4444, transparent: true, opacity: 0.7 },
  TOWER: { color: 0x2194ce, transparent: true, opacity: 1 },
  SELECTED_TOWER: { color: 0x00ff28, transparent: true, opacity: 1 },
  PLANE: 0x202020,
  ENEMY: { color: 0x888888, transparent: true, opacity: 1 },
  ALLY: { color: new THREE.Color(0x888888), transparent: true, opacity: 1 },
} as const

export const AllyTypes = {
  WATER: { color: new THREE.Color(0x4277ff), transparent: true, opacity: 1 },
  FIRE: { color: new THREE.Color(0xff4444), transparent: true, opacity: 1 },
  EARTH: { color: new THREE.Color(0x423333), transparent: true, opacity: 1 },
  AIR: { color: new THREE.Color(0x42ffff), transparent: true, opacity: 1 },
} as const
