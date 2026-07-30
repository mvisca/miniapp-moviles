import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductDetail } from '../../api/products';
import { ApiError } from '../../api/client';
import ProductImage from '../../components/ProductImage/ProductImage';
import ProductDescription from '../../components/ProductDescription/ProductDescription';
import ProductActions from '../../components/ProductActions/ProductActions';
import { useProductTitle } from '../../context/ProductTitleContext';
import type { ProductDetail } from '../../types/domain';
import styles from './ProductDetailPage.module.css';

type Status = 'loading' | 'notFound' | 'error' | 'success';

/**
 * PDP (SPEC-006, TASK-006-4): fetchea `getProductDetail(id)` en un
 * `useEffect` y maneja cuatro estados con `useState`, mismo patrón que
 * `ProductListPage` (SPEC-005). Distingue 404 de otros errores inspeccionando
 * `error instanceof ApiError && error.status === 404` (api/client.ts).
 *
 * Escribe el título de producto en `ProductTitleContext` (para el
 * breadcrumb de `Header`, SPEC-004) al llegar la respuesta con éxito, y lo
 * limpia al desmontar para que un futuro producto no arrastre el título
 * viejo.
 */
function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setTitle } = useProductTitle();
  const [status, setStatus] = useState<Status>('loading');
  const [product, setProduct] = useState<ProductDetail | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    getProductDetail(id)
      .then((result) => {
        if (cancelled) return;
        setProduct(result);
        setStatus('success');
        setTitle(`${result.brand} ${result.model}`);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus('notFound');
        } else {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      setTitle(null);
    };
  }, [id, setTitle]);

  if (status === 'loading') {
    return <p className={styles.message}>Cargando producto...</p>;
  }

  if (status === 'notFound') {
    return (
      <div className={styles.message}>
        <p>Producto no encontrado</p>
        <Link to="/">Volver al listado</Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.message}>
        <p>No se pudo cargar el producto.</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className={styles.page}>
      <ProductImage imgUrl={product.imgUrl} brand={product.brand} model={product.model} />
      <ProductDescription product={product} />
      <ProductActions product={product} />
    </div>
  );
}

export default ProductDetailPage;
