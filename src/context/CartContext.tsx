import { createContext, useContext, useState, type ReactNode } from 'react';
import { addToCart } from '../api/cart';
import { isValidIncrement } from '../utils/isValidIncrement';

const CART_COUNT_KEY = 'cartCount';

const SESSION_LOST_MESSAGE =
  'Se perdió el carrito anterior, se inició uno nuevo.';

interface CartContextValue {
  count: number;
  setCount: (count: number) => void;
  addItem: (id: string, colorCode: number, storageCode: number) => Promise<void>;
  sessionLostNotice: string | null;
  clearSessionLostNotice: () => void;
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
 * Contenedor de estado del contador de carrito (SPEC-004) ampliado por
 * SPEC-007 con `addItem`: llama a `addToCart`, aplica la heurística
 * `isValidIncrement` para detectar sesión perdida, y persiste SIEMPRE el
 * nuevo count (autoritativo del server) en `localStorage`, sea cual sea el
 * resultado de la heurística (CLAUDE.md §3).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number>(readInitialCount);
  const [sessionLostNotice, setSessionLostNotice] = useState<string | null>(
    null,
  );

  async function addItem(
    id: string,
    colorCode: number,
    storageCode: number,
  ): Promise<void> {
    const prevCount = count;
    const newCount = await addToCart(id, colorCode, storageCode);

    if (!isValidIncrement(prevCount, newCount)) {
      setSessionLostNotice(SESSION_LOST_MESSAGE);
    }

    localStorage.setItem(CART_COUNT_KEY, String(newCount));
    setCount(newCount);
  }

  function clearSessionLostNotice(): void {
    setSessionLostNotice(null);
  }

  return (
    <CartContext.Provider
      value={{
        count,
        setCount,
        addItem,
        sessionLostNotice,
        clearSessionLostNotice,
      }}
    >
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
