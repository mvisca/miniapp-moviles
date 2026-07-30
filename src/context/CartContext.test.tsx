import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CartProvider, useCart } from './CartContext';

// TDD baseline (TASK-004-0): el count expuesto refleja el valor inicial de
// localStorage y el setter lo actualiza. Sin lógica de red ni de sesión
// perdida aquí (eso es SPEC-007) — solo el contenedor de estado.
describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('expone count 0 cuando no hay nada en localStorage', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current.count).toBe(0);
  });

  it('expone el count inicial leído de localStorage', () => {
    localStorage.setItem('cartCount', '3');

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current.count).toBe(3);
  });

  it('expone count 0 si el valor de localStorage no es un número válido', () => {
    localStorage.setItem('cartCount', 'not-a-number');

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current.count).toBe(0);
  });

  it('setCount actualiza el count expuesto', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.setCount(5);
    });

    expect(result.current.count).toBe(5);
  });

  it('useCart lanza un error si se usa fuera de CartProvider', () => {
    expect(() => renderHook(() => useCart())).toThrow();
  });
});
