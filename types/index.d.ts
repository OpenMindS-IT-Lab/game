type AllyType = 'water' | 'fire' | 'earth' | 'air'
type TowerTexture<T extends AllyType | 'ground' = 'ground'> = Textures.TowerMaterial<T>
type TextureData<T extends 'fire' | undefined = undefined> = Textures.Data<T>
type Timeout = NodeJS.Timeout | 0
