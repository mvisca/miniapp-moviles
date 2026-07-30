import { describe, expect, it } from 'vitest';
import { parsePrice } from './parsePrice';

describe('parsePrice', () => {
  it('devuelve null para string vacío', () => {
    expect(parsePrice('')).toBeNull();
  });

  it('devuelve el número para un string numérico', () => {
    expect(parsePrice('299')).toBe(299);
  });

  it('devuelve null para un string no numérico', () => {
    expect(parsePrice('abc')).toBeNull();
  });

  it('devuelve null para un string parcialmente numérico (no laxo)', () => {
    expect(parsePrice('299abc')).toBeNull();
  });

  it('parsea números decimales', () => {
    expect(parsePrice('299.99')).toBe(299.99);
  });
});
