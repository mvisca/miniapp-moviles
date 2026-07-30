import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProductDetailRaw, ProductListItemRaw } from '../types/api'

vi.mock('./client', () => ({
  request: vi.fn(),
}))

import { request } from './client'
import {
  getProductDetail,
  getProducts,
  mapProductDetail,
  mapProductListItem,
} from './products'

const requestMock = vi.mocked(request)

afterEach(() => {
  vi.resetAllMocks()
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
  it('fetches GET /api/product and maps each item', async () => {
    const raw: ProductListItemRaw[] = [
      { id: '1', brand: 'Acer', model: 'A1', price: '100', imgUrl: 'a.png' },
      { id: '2', brand: 'Acer', model: 'A2', price: '', imgUrl: 'b.png' },
    ]
    requestMock.mockResolvedValueOnce(raw)

    const result = await getProducts()

    expect(requestMock).toHaveBeenCalledWith('/api/product')
    expect(result).toEqual([
      { id: '1', brand: 'Acer', model: 'A1', price: 100, imgUrl: 'a.png' },
      { id: '2', brand: 'Acer', model: 'A2', price: null, imgUrl: 'b.png' },
    ])
  })
})

describe('getProductDetail', () => {
  const raw: ProductDetailRaw = {
    id: '1',
    brand: 'Acer',
    model: 'Liquid E700',
    price: '199',
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
})
