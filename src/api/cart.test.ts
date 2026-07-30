import { afterEach, describe, expect, it, vi } from 'vitest'
import { addToCart } from './cart'
import { request } from './client'

vi.mock('./client', () => ({
  request: vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addToCart', () => {
  it('POSTs to /api/cart with the given id, colorCode and storageCode', async () => {
    vi.mocked(request).mockResolvedValue({ count: 3 })

    await addToCart('1', 1, 2)

    expect(request).toHaveBeenCalledWith('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '1', colorCode: 1, storageCode: 2 }),
    })
  })

  it('resolves with the count from the response', async () => {
    vi.mocked(request).mockResolvedValue({ count: 7 })

    const result = await addToCart('1', 1, 2)

    expect(result).toBe(7)
  })

  it('propagates errors thrown by request (e.g. ApiError)', async () => {
    vi.mocked(request).mockRejectedValue(new Error('boom'))

    await expect(addToCart('1', 1, 2)).rejects.toThrow('boom')
  })
})
