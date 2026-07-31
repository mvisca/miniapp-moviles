import { describe, expect, it } from 'vitest'
import { formatSpecValue } from './formatSpecValue'

describe('formatSpecValue', () => {
  it('devuelve el valor tal cual si no está vacío', () => {
    expect(formatSpecValue('5 MP')).toBe('5 MP')
  })

  it('unifica un string vacío a "-"', () => {
    expect(formatSpecValue('')).toBe('-')
  })

  it('unifica whitespace-only a "-"', () => {
    expect(formatSpecValue('   ')).toBe('-')
  })

  it('deja "-" tal cual cuando el API ya lo trae así', () => {
    expect(formatSpecValue('-')).toBe('-')
  })

  it('recorta espacios de un valor no vacío', () => {
    expect(formatSpecValue('  16 GB  ')).toBe('16 GB')
  })
})
