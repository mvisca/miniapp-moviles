import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRetryingFetch } from './useRetryingFetch'

/** Flushea microtasks pendientes (resoluciones/rechazos de promesas) sin avanzar el reloj. */
async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
}

/** Avanza el reloj fake `ms` y flushea las promesas resultantes de timers que se disparen. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('useRetryingFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resuelve en el intento inicial exitoso sin reintentos', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { result } = renderHook(() => useRetryingFetch(fetcher))

    expect(result.current.status).toBe('loading')

    await flush()

    expect(result.current.status).toBe('success')
    expect(result.current.data).toBe('ok')
    expect(result.current.attempt).toBe(1)
    expect(result.current.secondsRemaining).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('reintenta en los delays correctos con countdown regresivo hasta el éxito', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('ok')

    const { result } = renderHook(() => useRetryingFetch(fetcher))

    // Falla el intento 1 -> pasa a 'retrying' con delay de 2s.
    await flush()
    expect(result.current.status).toBe('retrying')
    expect(result.current.attempt).toBe(1)
    expect(result.current.secondsRemaining).toBe(2)

    await advance(1000)
    expect(result.current.secondsRemaining).toBe(1)

    // Se cumple el delay completo -> intento 2, que también falla -> delay de 4s.
    await advance(1000)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.current.attempt).toBe(2)
    expect(result.current.status).toBe('retrying')
    expect(result.current.secondsRemaining).toBe(4)

    // Se cumple el delay de 4s -> intento 3, que resuelve con éxito.
    await advance(4000)
    expect(result.current.status).toBe('success')
    expect(result.current.attempt).toBe(3)
    expect(result.current.data).toBe('ok')
    expect(result.current.secondsRemaining).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('agota los 5 reintentos y termina en error sin timers pendientes', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('always fails'))

    const { result } = renderHook(() => useRetryingFetch(fetcher))

    // Intento inicial (1) + 5 reintentos = 6 intentos totales, delays [2,4,6,8,10].
    await flush()
    expect(result.current.status).toBe('retrying')

    await advance(2000)
    expect(result.current.attempt).toBe(2)

    await advance(4000)
    expect(result.current.attempt).toBe(3)

    await advance(6000)
    expect(result.current.attempt).toBe(4)

    await advance(8000)
    expect(result.current.attempt).toBe(5)

    await advance(10000)

    // El intento 6 (tras agotar los 5 delays) falla -> error final, sin más timers.
    expect(result.current.attempt).toBe(6)
    expect(result.current.status).toBe('error')
    expect(result.current.secondsRemaining).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(6)

    await advance(60000)
    expect(fetcher).toHaveBeenCalledTimes(6)
    expect(result.current.status).toBe('error')
  })

  it('shouldRetry devolviendo false en el primer fallo va directo a error sin agendar timers', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('404'))
    const shouldRetry = vi.fn().mockReturnValue(false)

    const { result } = renderHook(() => useRetryingFetch(fetcher, { shouldRetry }))

    await flush()

    expect(result.current.status).toBe('error')
    expect(result.current.attempt).toBe(1)
    expect(result.current.secondsRemaining).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)

    await advance(60000)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('retry() tras status error reinicia el ciclo completo', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('recovered')
    const shouldRetry = vi.fn().mockReturnValue(false)

    const { result } = renderHook(() => useRetryingFetch(fetcher, { shouldRetry }))

    await flush()
    expect(result.current.status).toBe('error')
    expect(result.current.attempt).toBe(1)

    act(() => {
      result.current.retry()
    })
    await flush()

    expect(result.current.status).toBe('success')
    expect(result.current.attempt).toBe(1)
    expect(result.current.data).toBe('recovered')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('limpia los timers al desmontar en medio de un retrying', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'))
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { result, unmount } = renderHook(() => useRetryingFetch(fetcher))

    await flush()
    expect(result.current.status).toBe('retrying')

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(clearIntervalSpy).toHaveBeenCalled()

    const callsBefore = fetcher.mock.calls.length
    await advance(60000)
    expect(fetcher).toHaveBeenCalledTimes(callsBefore)

    clearTimeoutSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })

  it('reacciona a cambios en deps reiniciando el ciclo desde el intento 1', async () => {
    const fetcherA = vi.fn().mockResolvedValue('a')
    const fetcherB = vi.fn().mockResolvedValue('b')

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) =>
        useRetryingFetch(id === 'a' ? fetcherA : fetcherB, { deps: [id] }),
      { initialProps: { id: 'a' } },
    )

    await flush()
    expect(result.current.status).toBe('success')
    expect(result.current.data).toBe('a')

    rerender({ id: 'b' })
    await flush()

    expect(result.current.status).toBe('success')
    expect(result.current.data).toBe('b')
    expect(result.current.attempt).toBe(1)
    expect(fetcherB).toHaveBeenCalledTimes(1)
  })
})
