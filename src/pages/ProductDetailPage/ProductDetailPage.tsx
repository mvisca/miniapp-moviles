import { useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductDetail } from '../../api/products';
import { ApiError } from '../../api/client';
import { useRetryingFetch } from '../../hooks/useRetryingFetch';
import RetryCountdown from '../../components/RetryCountdown/RetryCountdown';
import ProductImage from '../../components/ProductImage/ProductImage';
import ProductDescription from '../../components/ProductDescription/ProductDescription';
import ProductActions from '../../components/ProductActions/ProductActions';
import { useCart } from '../../context/CartContext';
import { useProductTitle } from '../../context/ProductTitleContext';
import styles from './ProductDetailPage.module.css';

const TOTAL_ATTEMPTS = 5;

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * PDP (SPEC-006, TASK-006-4; reintentos SPEC-011, TASK-011-4): fetchea
 * `getProductDetail(id)` vía `useRetryingFetch` (backoff lineal ante
 * cold-start del backend), con `shouldRetry` excluyendo 404 -- un 404 es una
 * respuesta válida del servidor (id inexistente), no una falla de red, así
 * que corta el ciclo en el primer intento y no pasa por `retrying`.
 *
 * Escribe el título de producto en `ProductTitleContext` (para el
 * breadcrumb de `Header`, SPEC-004) al llegar la respuesta con éxito, y lo
 * limpia al desmontar para que un futuro producto no arrastre el título
 * viejo. Ambos efectos van separados del fetch: el fetch en sí ahora lo
 * maneja `useRetryingFetch`, no hay un único `.then()` donde colgar el
 * side-effect de título.
 */
function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setTitle } = useProductTitle();
  const { addItem } = useCart();

  const fetcher = useCallback(() => getProductDetail(id!), [id]);
  const shouldRetry = useCallback((error: unknown) => !isNotFound(error), []);

  const {
    status,
    data: product,
    error,
    attempt,
    secondsRemaining,
    retry,
  } = useRetryingFetch(fetcher, { deps: [id], shouldRetry });

  useEffect(() => {
    if (!product) return;
    setTitle(`${product.brand} ${product.model}`);
  }, [product, setTitle]);

  useEffect(() => {
    return () => {
      setTitle(null);
    };
  }, [setTitle]);

  if (status === 'loading') {
    return <p className={styles.message}>Cargando producto...</p>;
  }

  if (status === 'retrying') {
    return (
      <RetryCountdown
        attempt={attempt}
        totalAttempts={TOTAL_ATTEMPTS}
        secondsRemaining={secondsRemaining ?? 0}
      />
    );
  }

  if (status === 'error') {
    if (isNotFound(error)) {
      return (
        <div className={styles.message}>
          <p>Producto no encontrado</p>
          <Link to="/">Volver al listado</Link>
        </div>
      );
    }

    return (
      <div className={styles.message}>
        <p>No se pudo cargar el producto.</p>
        <button type="button" className={styles.retryButton} onClick={retry}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className={styles.page}>
      <ProductImage imgUrl={product.imgUrl} brand={product.brand} model={product.model} />
      <div className={styles.info}>
        <ProductDescription product={product} />
        <ProductActions
          product={product}
          onAddToCart={({ colorCode, storageCode }) => {
            if (colorCode === undefined || storageCode === undefined) return Promise.resolve();
            return addItem(product.id, colorCode, storageCode);
          }}
        />
      </div>
    </div>
  );
}

export default ProductDetailPage;
