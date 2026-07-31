import { describe, expect, it } from 'vitest'
import { getColorSwatches } from './colorSwatches'

describe('getColorSwatches', () => {
  it('resuelve un color simple', () => {
    expect(getColorSwatches('Black')).toEqual(['#000000'])
  })

  it('es case-insensitive (duplicados de capitalización del API)', () => {
    expect(getColorSwatches('black')).toEqual(['#000000'])
    expect(getColorSwatches('Black')).toEqual(getColorSwatches('black'))
  })

  it('resuelve un color compuesto listado literalmente (con "/")', () => {
    expect(getColorSwatches('Black/Blue')).toEqual(['#000000', '#0000FF'])
  })

  it('resuelve un nombre descriptivo largo con múltiples colores', () => {
    expect(
      getColorSwatches('Ceramic White and Pearl Red with 3 exchangeable battery covers'),
    ).toEqual(['#F5F5F5', '#FF1493'])
  })

  it('resuelve una "edición" mapeada directamente (Ferrari edition)', () => {
    expect(getColorSwatches('Ferrari edition')).toEqual(['#FF2800'])
  })

  it('resuelve "Various" como color directo', () => {
    expect(getColorSwatches('Various')).toEqual(['#CCCCCC'])
  })

  it('parte por "/" un compuesto no listado literalmente si ambos tokens resuelven', () => {
    expect(getColorSwatches('Red/Green')).toEqual(['#FF0000', '#008000'])
  })

  it('devuelve null si el nombre no está en el diccionario', () => {
    expect(getColorSwatches('Vantablack Deluxe')).toBeNull()
  })

  it('devuelve null (no un stack parcial) si solo un lado del compuesto resuelve', () => {
    expect(getColorSwatches('Red/Vantablack')).toBeNull()
  })
})
