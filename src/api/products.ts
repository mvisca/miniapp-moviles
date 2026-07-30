// Capa de datos: productos. Fetch + mappers colocados (ver CLAUDE.md §4.4).
// Los mappers viven junto al fetch porque son parte del mismo contrato:
// aíslan las inconsistencias reales del API (precio vacío, campos
// polimórficos, swap displaySize/displayResolution) del resto de la app.

import { request } from './client'
import type { ProductDetailRaw, ProductListItemRaw } from '../types/api'
import type { Product, ProductDetail } from '../types/domain'
import { parsePrice } from '../utils/parsePrice'
import { toList } from '../utils/toList'

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
  const raw = await request<ProductListItemRaw[]>('/api/product')
  return raw.map(mapProductListItem)
}

export async function getProductDetail(id: string): Promise<ProductDetail> {
  // No se captura el ApiError: debe propagar sin capturar para que quien
  // consuma esta función (la PDP, SPEC-006) pueda distinguir un 404 de
  // otros fallos.
  const raw = await request<ProductDetailRaw>(`/api/product/${id}`)
  return mapProductDetail(raw)
}
