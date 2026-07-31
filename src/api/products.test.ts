import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductDetailRaw, ProductListItemRaw } from '../types/api'

vi.mock('./client', () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  }
  return { request: vi.fn(), ApiError }
})

import { ApiError, request } from './client'
import { getProductDetail, getProducts, mapProductDetail, mapProductListItem } from './products'
import { setProductDetailCache, setProductsCache } from '../utils/cache'
import type { Product, ProductDetail } from '../types/domain'

const requestMock = vi.mocked(request)

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vi.useRealTimers()
})

describe('mapProductListItem', () => {
  it('maps a raw list item to a domain Product, parsing price', () => {
    const raw: ProductListItemRaw = {
      id: '1',
      brand: 'Acer',
      model: 'Liquid E700',
      price: '299',
      imgUrl: 'https://example.com/img.png',
    }

    expect(mapProductListItem(raw)).toEqual({
      id: '1',
      brand: 'Acer',
      model: 'Liquid E700',
      price: 299,
      imgUrl: 'https://example.com/img.png',
    })
  })

  it('maps price: "" to null', () => {
    const raw: ProductListItemRaw = {
      id: '2',
      brand: 'Acer',
      model: 'beTouch E120',
      price: '',
      imgUrl: 'https://example.com/img2.png',
    }

    expect(mapProductListItem(raw).price).toBeNull()
  })
})

describe('mapProductDetail', () => {
  const baseRaw: ProductDetailRaw = {
    id: '1',
    brand: 'Acer',
    model: 'Liquid E700',
    price: '199',
    imgUrl: 'https://example.com/img.png',
    cpu: ['ST Ericsson PNX6715', '416 MHz'],
    ram: ['2 GB RAM or 4 GB', '1 GB RAM'],
    os: 'Android 4.4.4 (KitKat)',
    displaySize: '480 x 800 pixels',
    displayResolution: '4.5 inches',
    battery: '1500 mAh',
    primaryCamera: ['5 MP', 'LED flash'],
    secondaryCmera: 'VGA',
    dimentions: '120 x 60 x 10 mm',
    weight: '120 g',
    options: {
      colors: [{ code: 1, name: 'Black' }],
      storages: [{ code: 1, name: '4 GB' }],
    },
  }

  it('corrects the displaySize/displayResolution swap: screenResolution comes from displaySize', () => {
    const result = mapProductDetail(baseRaw)

    expect(result.screenResolution).toBe('480 x 800 pixels')
  })

  it('normalizes polymorphic array fields by joining with ", "', () => {
    const result = mapProductDetail(baseRaw)

    expect(result.cpu).toBe('ST Ericsson PNX6715, 416 MHz')
    expect(result.ram).toBe('2 GB RAM or 4 GB, 1 GB RAM')
    expect(result.rearCamera).toBe('5 MP, LED flash')
  })

  it('normalizes polymorphic string fields as-is', () => {
    const result = mapProductDetail(baseRaw)

    expect(result.os).toBe('Android 4.4.4 (KitKat)')
    expect(result.frontCamera).toBe('VGA')
  })

  it('parses price and passes through remaining fields', () => {
    const result = mapProductDetail(baseRaw)

    expect(result.price).toBe(199)
    expect(result.id).toBe('1')
    expect(result.brand).toBe('Acer')
    expect(result.model).toBe('Liquid E700')
    expect(result.battery).toBe('1500 mAh')
    expect(result.dimensions).toBe('120 x 60 x 10 mm')
    expect(result.weight).toBe('120 g')
    expect(result.colors).toEqual([{ code: 1, name: 'Black' }])
    expect(result.storages).toEqual([{ code: 1, name: '4 GB' }])
  })

  it('maps price: "" to null', () => {
    const result = mapProductDetail({ ...baseRaw, price: '' })

    expect(result.price).toBeNull()
  })
})

describe('getProducts', () => {
  const raw: ProductListItemRaw[] = [
    { id: '1', brand: 'Acer', model: 'A1', price: '100', imgUrl: 'a.png' },
    { id: '2', brand: 'Acer', model: 'A2', price: '', imgUrl: 'b.png' },
  ]
  const mapped: Product[] = [
    { id: '1', brand: 'Acer', model: 'A1', price: 100, imgUrl: 'a.png' },
    { id: '2', brand: 'Acer', model: 'A2', price: null, imgUrl: 'b.png' },
  ]

  it('fetches GET /api/product and maps each item on a cache miss', async () => {
    requestMock.mockResolvedValueOnce(raw)

    const result = await getProducts()

    expect(requestMock).toHaveBeenCalledWith('/api/product')
    expect(result).toEqual(mapped)
  })

  it('cache miss: caches the mapped result, so a second call does not refetch', async () => {
    requestMock.mockResolvedValueOnce(raw)

    const first = await getProducts()
    const second = await getProducts()

    expect(first).toEqual(mapped)
    expect(second).toEqual(mapped)
    expect(requestMock).toHaveBeenCalledTimes(1)
  })

  it('cache hit: returns the cached data without calling request', async () => {
    setProductsCache(mapped)

    const result = await getProducts()

    expect(result).toEqual(mapped)
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('expired cache: refetches instead of returning the stale entry', async () => {
    vi.useFakeTimers()
    setProductsCache(mapped)

    vi.advanceTimersByTime(3600_000 + 1)

    requestMock.mockResolvedValueOnce(raw)

    const result = await getProducts()

    expect(result).toEqual(mapped)
    expect(requestMock).toHaveBeenCalledTimes(1)
  })
})

describe('getProductDetail', () => {
  const raw: ProductDetailRaw = {
    id: '1',
    brand: 'Acer',
    model: 'Liquid E700',
    price: '199',
    imgUrl: 'https://example.com/img.png',
    cpu: 'ST Ericsson PNX6715',
    ram: '2 GB RAM',
    os: 'Android 4.4.4',
    displaySize: '480 x 800 pixels',
    displayResolution: '4.5 inches',
    battery: '1500 mAh',
    primaryCamera: '5 MP',
    secondaryCmera: 'VGA',
    dimentions: '120 x 60 x 10 mm',
    weight: '120 g',
    options: {
      colors: [{ code: 1, name: 'Black' }],
      storages: [{ code: 1, name: '4 GB' }],
    },
  }

  it('fetches GET /api/product/:id and maps the result', async () => {
    requestMock.mockResolvedValueOnce(raw)

    const result = await getProductDetail('1')

    expect(requestMock).toHaveBeenCalledWith('/api/product/1')
    expect(result.screenResolution).toBe('480 x 800 pixels')
    expect(result.price).toBe(199)
  })

  it('propagates errors from request (e.g. ApiError with status 404) uncaught', async () => {
    const error = new Error('not found')
    requestMock.mockRejectedValueOnce(error)

    await expect(getProductDetail('does-not-exist')).rejects.toBe(error)
  })

  it('cache miss: caches the mapped result, so a second call for the same id does not refetch', async () => {
    requestMock.mockResolvedValueOnce(raw)

    const first = await getProductDetail('1')
    const second = await getProductDetail('1')

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(requestMock).toHaveBeenCalledWith('/api/product/1')
    expect(second).toEqual(first)
    expect(localStorage.getItem('product_detail_1')).not.toBeNull()
  })

  it('cache hit: returns the cached data without calling request', async () => {
    const cachedDetail: ProductDetail = mapProductDetail(raw)
    setProductDetailCache('1', cachedDetail)

    const result = await getProductDetail('1')

    expect(result).toEqual(cachedDetail)
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('expired cache: refetches instead of returning the stale entry', async () => {
    vi.useFakeTimers()
    const cachedDetail: ProductDetail = mapProductDetail(raw)
    setProductDetailCache('1', cachedDetail)

    vi.advanceTimersByTime(3600_000 + 1)

    requestMock.mockResolvedValueOnce(raw)

    const result = await getProductDetail('1')

    expect(result).toEqual(cachedDetail)
    expect(requestMock).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failed request (404 / ApiError)', async () => {
    const error = new Error('not found')
    requestMock.mockRejectedValueOnce(error)

    await expect(getProductDetail('does-not-exist')).rejects.toBe(error)

    expect(localStorage.getItem('product_detail_does-not-exist')).toBeNull()
  })

  it('caches two different ids independently', async () => {
    const raw2: ProductDetailRaw = { ...raw, id: '2', brand: 'Acer', model: 'A2' }
    requestMock.mockResolvedValueOnce(raw).mockResolvedValueOnce(raw2)

    const detail1 = await getProductDetail('1')
    const detail2 = await getProductDetail('2')

    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(requestMock).toHaveBeenNthCalledWith(1, '/api/product/1')
    expect(requestMock).toHaveBeenNthCalledWith(2, '/api/product/2')

    // Refetching either id again should hit cache, not request, and not
    // disturb the other id's entry.
    const detail1Again = await getProductDetail('1')
    const detail2Again = await getProductDetail('2')

    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(detail1Again).toEqual(detail1)
    expect(detail2Again).toEqual(detail2)
  })

  describe('500 sin distinguir id inexistente (cross-check contra el listado, CLAUDE.md §4.1b)', () => {
    const listRaw: ProductListItemRaw[] = [
      { id: '1', brand: 'Acer', model: 'A1', price: '100', imgUrl: 'a.png' },
    ]

    it('id ausente del listado: sintetiza un ApiError 404 en vez del 500 original', async () => {
      requestMock
        .mockRejectedValueOnce(new ApiError(500, 'An Unexpected Error Occurred'))
        .mockResolvedValueOnce(listRaw)

      await expect(getProductDetail('does-not-exist')).rejects.toMatchObject({ status: 404 })
    })

    it('id presente en el listado: no se puede confirmar ausencia, se repropaga el error original', async () => {
      const error = new ApiError(500, 'An Unexpected Error Occurred')
      requestMock.mockRejectedValueOnce(error).mockResolvedValueOnce(listRaw)

      await expect(getProductDetail('1')).rejects.toBe(error)
    })

    it('el listado también falla: no se puede confirmar, se repropaga el error original', async () => {
      const error = new ApiError(500, 'An Unexpected Error Occurred')
      requestMock.mockRejectedValueOnce(error).mockRejectedValueOnce(new Error('network down'))

      await expect(getProductDetail('does-not-exist')).rejects.toBe(error)
    })

    it('no cachea el 404 sintetizado', async () => {
      requestMock
        .mockRejectedValueOnce(new ApiError(500, 'An Unexpected Error Occurred'))
        .mockResolvedValueOnce(listRaw)

      await expect(getProductDetail('does-not-exist')).rejects.toMatchObject({ status: 404 })

      expect(localStorage.getItem('product_detail_does-not-exist')).toBeNull()
    })
  })
})
