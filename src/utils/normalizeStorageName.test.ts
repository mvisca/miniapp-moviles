import { describe, expect, it } from 'vitest'
import { normalizeStorageName } from './normalizeStorageName'

describe('normalizeStorageName', () => {
  it('devuelve el nombre tal cual si no está vacío', () => {
    expect(normalizeStorageName('16 GB')).toBe('16 GB')
  })

  it('normaliza un nombre whitespace-only a "N/A"', () => {
    expect(normalizeStorageName(' ')).toBe('N/A')
  })

  it('normaliza un string vacío a "N/A"', () => {
    expect(normalizeStorageName('')).toBe('N/A')
  })
})
