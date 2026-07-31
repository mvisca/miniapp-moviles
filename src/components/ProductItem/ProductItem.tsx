import { Link } from 'react-router-dom'
import type { Product } from '../../types/domain'
import styles from './ProductItem.module.css'

interface ProductItemProps {
  product: Product
}

/**
 * Presentacional puro (SPEC-005, CLAUDE.md §6): imagen, marca, modelo y
 * precio (o "No disponible" si `price` es `null`). Envuelve todo el card en
 * un `Link` a la PDP — la navegación al detalle siempre está habilitada,
 * incluso sin precio (CLAUDE.md §4.1/§4.2): "acción deshabilitada" se
 * traduce a `aria-disabled` + estilo, no a bloquear el link.
 */
function ProductItem({ product }: ProductItemProps) {
  const isAvailable = product.price !== null

  return (
    <Link
      to={`/product/${product.id}`}
      className={styles.card}
      aria-disabled={isAvailable ? undefined : 'true'}
    >
      <img
        className={styles.image}
        src={product.imgUrl}
        alt={`${product.brand} ${product.model}`}
      />
      <div className={styles.info}>
        <p className={styles.brand}>{product.brand}</p>
        <p className={styles.model}>{product.model}</p>
        {isAvailable ? (
          <p className={styles.price}>{product.price} €</p>
        ) : (
          <p className={styles.unavailable}>No disponible</p>
        )}
      </div>
    </Link>
  )
}

export default ProductItem
