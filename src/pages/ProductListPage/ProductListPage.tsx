import { useState } from 'react'
import { getProducts } from '../../api/products'
import ProductItem from '../../components/ProductItem/ProductItem'
import RetryCountdown from '../../components/RetryCountdown/RetryCountdown'
import Search from '../../components/Search/Search'
import { useRetryingFetch } from '../../hooks/useRetryingFetch'
import styles from './ProductListPage.module.css'

// Número de reintentos automáticos definido en SPEC-011 (delays
// [2,4,6,8,10]s). Detalle de configuración de esta página, no algo que
// exponga useRetryingFetch -- se declara como constante local.
const TOTAL_ATTEMPTS = 5

// PLP (SPEC-005/SPEC-011, TASK-011-3): fetchea el catálogo con
// useRetryingFetch(getProducts), que reemplaza el useEffect + useState<Status>
// manual anterior por reintentos automáticos en backoff lineal ante el
// cold-start del backend (Render free tier). El filtro de búsqueda se sigue
// derivando en cada render sobre `products` -- no hay estado ni efecto
// separado para la lista filtrada (CLAUDE.md §6).
function ProductListPage() {
  const { status, data, attempt, secondsRemaining, retry } = useRetryingFetch(getProducts, {
    deps: [],
  })
  const [searchTerm, setSearchTerm] = useState('')
  const products = data ?? []

  if (status === 'loading') {
    return <p className={styles.message}>Cargando productos...</p>
  }

  if (status === 'retrying') {
    return (
      <RetryCountdown
        attempt={attempt}
        totalAttempts={TOTAL_ATTEMPTS}
        secondsRemaining={secondsRemaining ?? 0}
      />
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.message}>
        <p>No se pudo cargar el catálogo de productos.</p>
        <button type="button" className={styles.retryButton} onClick={retry}>
          Reintentar
        </button>
      </div>
    )
  }

  const term = searchTerm.trim().toLowerCase()
  const filtered = term
    ? products.filter((product) => `${product.brand} ${product.model}`.toLowerCase().includes(term))
    : products

  return (
    <div className={styles.page}>
      <Search value={searchTerm} onChange={setSearchTerm} />

      {filtered.length === 0 ? (
        <p className={styles.empty}>No se encontraron resultados para «{searchTerm}»</p>
      ) : (
        <div className={`${styles.grid} fadeIn`}>
          {filtered.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductListPage
