import { describe, expect, it } from 'vitest'
import { toList } from './toList'

describe('toList', () => {
  it('envuelve un string en un array de un elemento', () => {
    expect(toList('foo')).toEqual(['foo'])
  })

  it('devuelve un array tal cual (identidad)', () => {
    const input = ['foo', 'bar']
    expect(toList(input)).toEqual(['foo', 'bar'])
  })
})
