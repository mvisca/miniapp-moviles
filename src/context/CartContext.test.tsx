import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addToCart } from '../api/cart';
import { CartProvider, useCart } from './CartContext';

vi.mock('../api/cart');

const mockedAddToCart = vi.mocked(addToCart);

// TDD baseline (TASK-004-0): el count expuesto refleja el valor inicial de
// localStorage y el setter lo actualiza. Sin lógica de red ni de sesión
// perdida aquí (eso es SPEC-007) — solo el contenedor de estado.
describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedAddToCart.mockReset();
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

  it('addItem llama a addToCart y actualiza count con el valor autoritativo del server', async () => {
    mockedAddToCart.mockResolvedValue(4);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem('some-id', 1, 2);
    });

    expect(mockedAddToCart).toHaveBeenCalledWith('some-id', 1, 2);
    expect(result.current.count).toBe(4);
  });

  it('addItem persiste el nuevo count en localStorage', async () => {
    mockedAddToCart.mockResolvedValue(7);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem('some-id', 1, 2);
    });

    expect(localStorage.getItem('cartCount')).toBe('7');
  });

  it('addItem no dispara aviso de sesión perdida cuando el count aumenta', async () => {
    localStorage.setItem('cartCount', '2');
    mockedAddToCart.mockResolvedValue(3);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem('some-id', 1, 2);
    });

    expect(result.current.sessionLostNotice).toBeNull();
  });

  it('addItem dispara aviso de sesión perdida cuando el count no aumenta (isValidIncrement da false)', async () => {
    localStorage.setItem('cartCount', '5');
    mockedAddToCart.mockResolvedValue(1);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem('some-id', 1, 2);
    });

    expect(result.current.sessionLostNotice).toBe(
      'Se perdió el carrito anterior, se inició uno nuevo.',
    );
    // Aun con la sesión perdida, el nuevo count se persiste siempre.
    expect(result.current.count).toBe(1);
    expect(localStorage.getItem('cartCount')).toBe('1');
  });

  it('clearSessionLostNotice limpia el aviso', async () => {
    localStorage.setItem('cartCount', '5');
    mockedAddToCart.mockResolvedValue(1);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem('some-id', 1, 2);
    });

    expect(result.current.sessionLostNotice).not.toBeNull();

    act(() => {
      result.current.clearSessionLostNotice();
    });

    await waitFor(() => {
      expect(result.current.sessionLostNotice).toBeNull();
    });
  });
});
