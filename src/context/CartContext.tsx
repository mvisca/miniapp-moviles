import { createContext, useContext, useState, type ReactNode } from 'react';

const CART_COUNT_KEY = 'cartCount';

interface CartContextValue {
  count: number;
  setCount: (count: number) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Lee el `count` inicial exclusivamente desde `localStorage['cartCount']`
 * (CLAUDE.md §3: `GET /api/cart` no existe — 404 verificado, no hay forma
 * de consultar el contador al servidor sin agregar un producto).
 * Si no existe o no es un número válido, `0`.
 */
function readInitialCount(): number {
  const raw = localStorage.getItem(CART_COUNT_KEY);

  if (raw === null) {
    return 0;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : 0;
}

/**
 * Contenedor de estado del contador de carrito (SPEC-004). Únicamente
 * expone `count` y su setter — no implementa `addToCart` ni la heurística
 * de sesión perdida (`isValidIncrement`), que es responsabilidad de
 * SPEC-007.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number>(readInitialCount);

  return (
    <CartContext.Provider value={{ count, setCount }}>
      {children}
    </CartContext.Provider>
  );
}

// Patrón estándar de Context: Provider + hook conviven en el mismo archivo.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }

  return context;
}
