import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client'

const BASE_URL = ''

function mockFetchOnce(response: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('request', () => {
  it('calls fetch with the base URL, the given path and credentials: include', async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    })

    await request('/api/product')

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/product`,
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('resolves with the parsed JSON body typed as T on a 2xx response', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: '1', brand: 'Acer' }),
    })

    const result = await request<{ id: string; brand: string }>('/api/product/1')

    expect(result).toEqual({ id: '1', brand: 'Acer' })
  })

  it('forwards extra RequestInit options (e.g. method, body) to fetch', async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ count: 1 }),
    })

    await request('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ id: '1' }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/cart`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id: '1' }),
        credentials: 'include',
      }),
    )
  })

  it('throws an ApiError preserving the status on a non-2xx response', async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found', code: 0 }),
    })

    await expect(request('/api/product/does-not-exist')).rejects.toMatchObject({
      status: 404,
    })
  })

  it('throws an instance of ApiError specifically', async () => {
    mockFetchOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid parameters', code: 0 }),
    })

    await expect(request('/api/cart')).rejects.toBeInstanceOf(ApiError)
  })
})
