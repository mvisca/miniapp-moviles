// Capa de datos: productos. Fetch + mappers colocados (ver CLAUDE.md §4.4).
// Los mappers viven junto al fetch porque son parte del mismo contrato:
// aíslan las inconsistencias reales del API (precio vacío, campos
// polimórficos, swap displaySize/displayResolution) del resto de la app.

import { request, ApiError } from './client'
import type { ProductDetailRaw, ProductListItemRaw } from '../types/api'
import type { Product, ProductDetail } from '../types/domain'
import { parsePrice } from '../utils/parsePrice'
import { toList } from '../utils/toList'
import {
  getProductDetailCache,
  getProductsCache,
  setProductDetailCache,
  setProductsCache,
} from '../utils/cache'

export function mapProductListItem(raw: ProductListItemRaw): Product {
  return {
    id: raw.id,
    brand: raw.brand,
    model: raw.model,
    price: parsePrice(raw.price),
    imgUrl: raw.imgUrl,
  }
}

export function mapProductDetail(raw: ProductDetailRaw): ProductDetail {
  return {
    id: raw.id,
    brand: raw.brand,
    model: raw.model,
    price: parsePrice(raw.price),
    imgUrl: raw.imgUrl,
    cpu: toList(raw.cpu).join(', '),
    ram: toList(raw.ram).join(', '),
    os: toList(raw.os).join(', '),
    // El API invierte estos dos campos: `displaySize` trae en realidad la
    // resolución en píxeles, `displayResolution` el tamaño físico en
    // pulgadas (ver CLAUDE.md §4.3). Se corrige acá, en el mapper.
    screenResolution: raw.displaySize,
    battery: raw.battery,
    rearCamera: toList(raw.primaryCamera).join(', '),
    frontCamera: toList(raw.secondaryCmera).join(', '),
    dimensions: raw.dimentions,
    weight: raw.weight,
    colors: raw.options.colors,
    storages: raw.options.storages,
  }
}

export async function getProducts(): Promise<Product[]> {
  const cached = getProductsCache()
  if (cached !== null) {
    return cached
  }

  const raw = await request<ProductListItemRaw[]>('/api/product')
  const mapped = raw.map(mapProductListItem)
  setProductsCache(mapped)
  return mapped
}

export async function getProductDetail(id: string): Promise<ProductDetail> {
  const cached = getProductDetailCache(id)
  if (cached !== null) {
    return cached
  }

  try {
    const raw = await request<ProductDetailRaw>(`/api/product/${id}`)
    const mapped = mapProductDetail(raw)
    setProductDetailCache(id, mapped)
    return mapped
  } catch (error) {
    // El API devuelve 500 genérico también para ids inexistentes, sin
    // distinguirlo de un fallo real de servidor (ver CLAUDE.md §4.1b). Si ya
    // es un 404 no hay nada que resolver: se propaga tal cual. Para
    // cualquier otro error, se intenta confirmar contra el listado
    // (cacheado o recién pedido) si el id existe; si no existe, se sintetiza
    // el mismo ApiError(404, ...) que ya maneja la PDP. Si no se puede
    // confirmar (el listado también falla) se propaga el error original y
    // sigue el backoff normal — no se cachea una respuesta fallida en
    // ningún caso.
    if (error instanceof ApiError && error.status === 404) {
      throw error
    }
    if (await isConfirmedMissing(id)) {
      throw new ApiError(404, `Product ${id} not found (verified against product list)`)
    }
    throw error
  }
}

async function isConfirmedMissing(id: string): Promise<boolean> {
  try {
    const products = await getProducts()
    return !products.some((product) => product.id === id)
  } catch {
    return false
  }
}
