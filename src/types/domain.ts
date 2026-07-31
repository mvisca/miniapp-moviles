// Tipos de dominio, limpios: los únicos que consume la UI.
// `mapProductListItem` y `mapProductDetail` (SPEC-003) convierten los
// tipos raw de `api.ts` a estos.

export interface Product {
  id: string
  brand: string
  model: string
  price: number | null
  imgUrl: string
}

export interface ProductDetail {
  id: string
  brand: string
  model: string
  price: number | null
  imgUrl: string
  cpu: string
  ram: string
  os: string
  screenResolution: string
  battery: string
  rearCamera: string // primaryCamera normalizado y unido
  frontCamera: string // secondaryCamera normalizado y unido
  dimensions: string
  weight: string
  colors: { code: number; name: string }[]
  storages: { code: number; name: string }[]
}
