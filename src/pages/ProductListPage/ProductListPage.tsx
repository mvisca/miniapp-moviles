import { useEffect, useState } from 'react'
import { getProducts } from '../../api/products'
import ProductItem from '../../components/ProductItem/ProductItem'
import Search from '../../components/Search/Search'
import type { Product } from '../../types/domain'
import styles from './ProductListPage.module.css'

type Status = 'loading' | 'error' | 'success'

// PLP (SPEC-005, TASK-005-2): fetchea el catálogo con getProducts() en un
// useEffect y maneja el estado a mano (sin librería de fetching, ver
// plan_content). `reloadKey` es la dependencia que dispara un nuevo fetch al
// pulsar "Reintentar" tras un error. El filtro de búsqueda se deriva en cada
// render sobre `products` -- no hay estado ni efecto separado para la lista
// filtrada (CLAUDE.md §6). No implementa caché (SPEC-008) ni contenido de la
// PDP (SPEC-006): solo necesita que el Link de ProductItem exista.
function ProductListPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    getProducts()
      .then((result) => {
        if (cancelled) return
        setProducts(result)
        setStatus('success')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const handleRetry = () => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }

  if (status === 'loading') {
    return <p className={styles.message}>Cargando productos...</p>
  }

  if (status === 'error') {
    return (
      <div className={styles.message}>
        <p>No se pudo cargar el catálogo de productos.</p>
        <button type="button" className={styles.retryButton} onClick={handleRetry}>
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
