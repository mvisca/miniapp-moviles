import type { ProductDetail } from '../../types/domain';
import styles from './ProductDescription.module.css';

interface ProductDescriptionProps {
  product: ProductDetail;
}

/**
 * Presentacional puro (SPEC-006, CLAUDE.md §6): specs del producto —
 * marca, modelo, precio, CPU, RAM, sistema operativo, resolución de
 * pantalla, batería, cámaras (trasera y frontal como líneas separadas),
 * dimensiones y peso.
 *
 * `product.screenResolution` ya viene corregido del swap de la API
 * (`mapProductDetail`, api/products.ts) — este componente solo lee el
 * campo ya normalizado, sin lógica de corrección propia.
 *
 * `price: null` -> "No disponible", mismo patrón que `ProductItem`
 * (SPEC-005).
 */
function ProductDescription({ product }: ProductDescriptionProps) {
  const isAvailable = product.price !== null;

  return (
    <div className={styles.description}>
      <p className={styles.brand}>{product.brand}</p>
      <h1 className={styles.model}>{product.model}</h1>
      {isAvailable ? (
        <p className={styles.price}>{product.price} €</p>
      ) : (
        <p className={styles.unavailable}>No disponible</p>
      )}
      <ul className={styles.specs}>
        <li>
          <span className={styles.label}>CPU:</span> <span>{product.cpu}</span>
        </li>
        <li>
          <span className={styles.label}>RAM:</span> <span>{product.ram}</span>
        </li>
        <li>
          <span className={styles.label}>Sistema operativo:</span>{' '}
          <span>{product.os}</span>
        </li>
        <li>
          <span className={styles.label}>Resolución de pantalla:</span>{' '}
          <span>{product.screenResolution}</span>
        </li>
        <li>
          <span className={styles.label}>Batería:</span>{' '}
          <span>{product.battery}</span>
        </li>
        <li>
          <span className={styles.label}>Cámara trasera:</span>{' '}
          <span>{product.rearCamera}</span>
        </li>
        <li>
          <span className={styles.label}>Cámara frontal:</span>{' '}
          <span>{product.frontCamera}</span>
        </li>
        <li>
          <span className={styles.label}>Dimensiones:</span>{' '}
          <span>{product.dimensions}</span>
        </li>
        <li>
          <span className={styles.label}>Peso:</span>{' '}
          <span>{product.weight}</span>
        </li>
      </ul>
    </div>
  );
}

export default ProductDescription;
