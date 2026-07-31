import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PRODUCT_CACHE_TTL_MS,
  getProductsCache,
  setProductsCache,
  getProductDetailCache,
  setProductDetailCache,
  getCartCount,
  setCartCount,
} from './cache'
import type { Product, ProductDetail } from '../types/domain'

const product: Product = {
  id: '1',
  brand: 'Acer',
  model: 'A1',
  price: 100,
  imgUrl: 'a.png',
}

const productDetail: ProductDetail = {
  id: '1',
  brand: 'Acer',
  model: 'A1',
  price: 100,
  imgUrl: 'a.png',
  cpu: 'cpu',
  ram: 'ram',
  os: 'os',
  screenResolution: '1080p',
  battery: '1000 mAh',
  rearCamera: '5 MP',
  frontCamera: '2 MP',
  dimensions: '1 x 2 x 3',
  weight: '100 g',
  colors: [],
  storages: [],
}

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getProductsCache/setProductsCache', () => {
    it('devuelve los datos originales para una entrada fresca', () => {
      vi.setSystemTime(new Date('2026-07-30T10:00:00Z'))
      setProductsCache([product])

      expect(getProductsCache()).toEqual([product])
    })

    it('devuelve null para una entrada expirada', () => {
      vi.setSystemTime(new Date('2026-07-30T10:00:00Z'))
      setProductsCache([product])

      vi.advanceTimersByTime(PRODUCT_CACHE_TTL_MS + 1)

      expect(getProductsCache()).toBeNull()
    })

    it('devuelve null y no lanza para JSON corrupto', () => {
      localStorage.setItem('products', 'not json')

      expect(getProductsCache()).toBeNull()
      expect(localStorage.getItem('products')).toBeNull()
    })

    it('devuelve null para una key inexistente', () => {
      expect(getProductsCache()).toBeNull()
    })
  })

  describe('getProductDetailCache/setProductDetailCache', () => {
    it('devuelve los datos originales para una entrada fresca', () => {
      setProductDetailCache('1', productDetail)

      expect(getProductDetailCache('1')).toEqual(productDetail)
    })

    it('devuelve null para una entrada expirada', () => {
      setProductDetailCache('1', productDetail)

      vi.advanceTimersByTime(PRODUCT_CACHE_TTL_MS + 1)

      expect(getProductDetailCache('1')).toBeNull()
    })

    it('aísla la caché por id: expirar/leer un id no afecta a otro', () => {
      setProductDetailCache('1', productDetail)
      setProductDetailCache('2', { ...productDetail, id: '2' })

      expect(getProductDetailCache('1')).toEqual(productDetail)
      expect(getProductDetailCache('2')).toEqual({ ...productDetail, id: '2' })
    })
  })

  describe('getCartCount/setCartCount', () => {
    it('devuelve el count persistido', () => {
      setCartCount(3)

      expect(getCartCount()).toBe(3)
    })

    it('devuelve null para una key inexistente', () => {
      expect(getCartCount()).toBeNull()
    })

    it('nunca expira, incluso mucho más allá de PRODUCT_CACHE_TTL_MS', () => {
      setCartCount(3)

      vi.advanceTimersByTime(PRODUCT_CACHE_TTL_MS * 100)

      expect(getCartCount()).toBe(3)
    })

    it('devuelve null y no lanza para JSON corrupto', () => {
      localStorage.setItem('cartCount', 'not json')

      expect(getCartCount()).toBeNull()
      expect(localStorage.getItem('cartCount')).toBeNull()
    })
  })
})
