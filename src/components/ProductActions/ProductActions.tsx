import { useEffect, useRef, useState } from 'react';
import type { ProductDetail } from '../../types/domain';
import styles from './ProductActions.module.css';

type Feedback = 'idle' | 'pending' | 'success' | 'error';

interface ProductActionsProps {
  product: ProductDetail;
  /**
   * Hook opcional para SPEC-007 (mutación real contra `addToCart` de
   * `api/cart.ts`). Si no se provee, el click no hace nada (comportamiento
   * actual). Devuelve una promesa (SPEC-011): resolverla/rechazarla
   * conduce el feedback visual del botón (idle -> pending -> success|error
   * -> idle tras ~2s).
   */
  onAddToCart?: (selection: {
    colorCode?: number;
    storageCode?: number;
  }) => Promise<void>;
}

const FEEDBACK_LABEL: Record<Feedback, string> = {
  idle: 'Añadir al carrito',
  pending: 'Añadiendo…',
  success: '✓ Añadido al carrito',
  error: 'No se pudo añadir, probá de nuevo',
};

/**
 * Presentacional (SPEC-006, CLAUDE.md §6/§4.1): selectores de storage y
 * color poblados EXCLUSIVAMENTE desde `product.storages` / `product.colors`
 * — nunca un valor hardcodeado ni fuera de esa lista, para que el frontend
 * nunca pueda enviar un código inválido a `POST /api/cart`. Botón "Añadir
 * al carrito" deshabilitado cuando `product.price` es `null`.
 *
 * Feedback de éxito/error (SPEC-011, TASK-011-2): estado local
 * `idle -> pending -> success | error -> idle` (revierte automáticamente
 * tras ~2s). El timeout de reversión se guarda en un `useRef` y se limpia
 * al desmontar, para evitar `setState` sobre un componente ya desmontado.
 */
function ProductActions({ product, onAddToCart }: ProductActionsProps) {
  const [storageCode, setStorageCode] = useState<number | undefined>(
    product.storages[0]?.code,
  );
  const [colorCode, setColorCode] = useState<number | undefined>(
    product.colors[0]?.code,
  );
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const revertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revertTimeoutRef.current !== null) {
        clearTimeout(revertTimeoutRef.current);
      }
    };
  }, []);

  const isAvailable = product.price !== null;

  function scheduleRevertToIdle() {
    if (revertTimeoutRef.current !== null) {
      clearTimeout(revertTimeoutRef.current);
    }
    revertTimeoutRef.current = setTimeout(() => {
      setFeedback('idle');
      revertTimeoutRef.current = null;
    }, 2000);
  }

  async function handleAddToCart() {
    if (!onAddToCart) return;

    setFeedback('pending');
    try {
      await onAddToCart({ colorCode, storageCode });
      setFeedback('success');
    } catch {
      setFeedback('error');
    }
    scheduleRevertToIdle();
  }

  return (
    <div className={styles.actions}>
      <div className={styles.field}>
        <label htmlFor="product-storage">Almacenamiento</label>
        <select
          id="product-storage"
          value={storageCode ?? ''}
          onChange={(e) => setStorageCode(Number(e.target.value))}
        >
          {product.storages.map((storage) => (
            <option key={storage.code} value={storage.code}>
              {storage.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="product-color">Color</label>
        <select
          id="product-color"
          value={colorCode ?? ''}
          onChange={(e) => setColorCode(Number(e.target.value))}
        >
          {product.colors.map((color) => (
            <option key={color.code} value={color.code}>
              {color.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className={`${styles.addButton} ${feedback === 'success' ? styles.addButtonSuccess : ''} ${
          feedback === 'error' ? styles.addButtonError : ''
        }`}
        disabled={!isAvailable || feedback === 'pending'}
        onClick={handleAddToCart}
      >
        {isAvailable ? FEEDBACK_LABEL[feedback] : 'Añadir al carrito'}
      </button>
    </div>
  );
}

export default ProductActions;
