import { describe, expect, it } from 'vitest';
import { isValidIncrement } from './isValidIncrement';

describe('isValidIncrement', () => {
  it('devuelve true cuando newCount es mayor que prevCount', () => {
    expect(isValidIncrement(3, 4)).toBe(true);
  });

  it('devuelve false cuando newCount es igual a prevCount', () => {
    expect(isValidIncrement(3, 3)).toBe(false);
  });

  it('devuelve false cuando newCount es menor que prevCount (sesión reseteada)', () => {
    expect(isValidIncrement(5, 1)).toBe(false);
  });
});
