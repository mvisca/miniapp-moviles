import { useState } from 'react';
import type { ProductDetail } from '../../types/domain';
import styles from './ProductActions.module.css';

interface ProductActionsProps {
  product: ProductDetail;
  /**
   * Hook opcional para SPEC-007 (mutación real contra `addToCart` de
   * `api/cart.ts`). En este task el click es un STUB: si no se provee,
   * no hace nada. No se importa ni se llama `addToCart` aquí (fuera de
   * alcance de SPEC-006, ver plan_content de TASK-006-3).
   */
  onAddToCart?: (selection: { colorCode?: number; storageCode?: number }) => void;
}

/**
 * Presentacional (SPEC-006, CLAUDE.md §6/§4.1): selectores de storage y
 * color poblados EXCLUSIVAMENTE desde `product.storages` / `product.colors`
 * — nunca un valor hardcodeado ni fuera de esa lista, para que el frontend
 * nunca pueda enviar un código inválido a `POST /api/cart`. Botón "Añadir
 * al carrito" deshabilitado cuando `product.price` es `null`.
 */
function ProductActions({ product, onAddToCart }: ProductActionsProps) {
  const [storageCode, setStorageCode] = useState<number | undefined>(
    product.storages[0]?.code,
  );
  const [colorCode, setColorCode] = useState<number | undefined>(
    product.colors[0]?.code,
  );

  const isAvailable = product.price !== null;

  function handleAddToCart() {
    onAddToCart?.({ colorCode, storageCode });
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
        className={styles.addButton}
        disabled={!isAvailable}
        onClick={handleAddToCart}
      >
        Añadir al carrito
      </button>
    </div>
  );
}

export default ProductActions;
