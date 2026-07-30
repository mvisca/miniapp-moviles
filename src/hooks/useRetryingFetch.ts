// Hook reutilizable de fetch con reintentos automáticos en backoff lineal.
// No usa ninguna librería de fetching externa (mismo criterio que el resto
// de la app: React puro). Ver SPEC-011 para el contrato completo.
import { useCallback, useEffect, useRef, useState } from 'react'

export type RetryStatus = 'loading' | 'retrying' | 'success' | 'error'

export interface RetryingFetchState<T> {
  status: RetryStatus
  data: T | null
  error: unknown
  attempt: number // 1-based, cuántos intentos ya se hicieron
  secondsRemaining: number | null // solo con status 'retrying'
  retry: () => void // reinicia el ciclo completo a mano (tras 'error')
}

interface UseRetryingFetchOptions {
  deps?: unknown[] // re-dispara el ciclo si cambian
  delaysSeconds?: number[] // default [2, 4, 6, 8, 10]
  shouldRetry?: (error: unknown) => boolean // default: () => true
}

const DEFAULT_DELAYS_SECONDS = [2, 4, 6, 8, 10]
const DEFAULT_SHOULD_RETRY = () => true
const EMPTY_DEPS: unknown[] = []

function areDepsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false
  }
  return true
}

export function useRetryingFetch<T>(
  fetcher: () => Promise<T>,
  options?: UseRetryingFetchOptions,
): RetryingFetchState<T> {
  const deps = options?.deps ?? EMPTY_DEPS

  const [status, setStatus] = useState<RetryStatus>('loading')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(1)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  // Identifica el ciclo vigente: cambia cuando cambian `deps` o al llamar a
  // `retry()`. El efecto de fetch está keyed por este valor, así que React
  // limpia (cancela) el ciclo anterior antes de arrancar el nuevo.
  const [cycleToken, setCycleToken] = useState(0)

  // Refs para leer siempre la versión más reciente de las opciones sin
  // forzar reruns del efecto de ciclo. Se sincronizan en un efecto (nunca
  // durante el render) para no mutar refs mientras React renderiza.
  const fetcherRef = useRef(fetcher)
  const shouldRetryRef = useRef(options?.shouldRetry ?? DEFAULT_SHOULD_RETRY)
  const delaysSecondsRef = useRef(options?.delaysSeconds ?? DEFAULT_DELAYS_SECONDS)
  useEffect(() => {
    fetcherRef.current = fetcher
    shouldRetryRef.current = options?.shouldRetry ?? DEFAULT_SHOULD_RETRY
    delaysSecondsRef.current = options?.delaysSeconds ?? DEFAULT_DELAYS_SECONDS
  })

  // Patrón de React para "resetear estado cuando cambia una prop/dependencia
  // externa" sin useEffect: se compara durante el render y, si cambió, se
  // reinicia el estado ahí mismo (React permite setState durante el render
  // del propio componente; produce un re-render inmediato antes de pintar).
  const [prevDeps, setPrevDeps] = useState(deps)
  if (!areDepsEqual(prevDeps, deps)) {
    setPrevDeps(deps)
    setCycleToken((token) => token + 1)
    setStatus('loading')
    setData(null)
    setError(null)
    setAttempt(1)
    setSecondsRemaining(null)
  }

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null

    const clearTimers = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const scheduleRetry = (nextAttempt: number, delaysSeconds: number[], delayIndex: number) => {
      const delay = delaysSeconds[delayIndex]
      setStatus('retrying')
      setSecondsRemaining(delay)

      let remaining = delay
      intervalId = setInterval(() => {
        if (cancelled) return
        remaining -= 1
        setSecondsRemaining(Math.max(remaining, 0))
      }, 1000)

      timeoutId = setTimeout(() => {
        if (cancelled) return
        clearTimers()
        setAttempt(nextAttempt)
        runFetch(nextAttempt)
      }, delay * 1000)
    }

    const runFetch = (attemptNumber: number) => {
      fetcherRef
        .current()
        .then((result) => {
          if (cancelled) return
          clearTimers()
          setStatus('success')
          setData(result)
          setError(null)
          setSecondsRemaining(null)
        })
        .catch((err: unknown) => {
          if (cancelled) return
          setError(err)

          const delaysSeconds = delaysSecondsRef.current
          const delayIndex = attemptNumber - 1
          const canRetry = shouldRetryRef.current(err) && delayIndex < delaysSeconds.length

          if (!canRetry) {
            clearTimers()
            setStatus('error')
            setSecondsRemaining(null)
            return
          }

          scheduleRetry(attemptNumber + 1, delaysSeconds, delayIndex)
        })
    }

    runFetch(1)

    return () => {
      cancelled = true
      clearTimers()
    }
  }, [cycleToken])

  const retry = useCallback(() => {
    setCycleToken((token) => token + 1)
    setStatus('loading')
    setData(null)
    setError(null)
    setAttempt(1)
    setSecondsRemaining(null)
  }, [])

  return { status, data, error, attempt, secondsRemaining, retry }
}
