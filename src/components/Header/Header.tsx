import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useCart } from '../../context/CartContext';
import { useProductTitle } from '../../context/ProductTitleContext';
import styles from './Header.module.css';

/**
 * Segundo segmento del breadcrumb en la PDP mientras el detalle del
 * producto está en curso de carga: elipsis animada `.` -> `..` -> `...`,
 * en loop (CLAUDE.md §6). SPEC-006 reemplaza este placeholder por
 * `‹marca› ‹modelo›` una vez exista el dato real — fuera de alcance aquí.
 */
function LoadingEllipsis() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  return <span data-testid="breadcrumb-ellipsis">{'.'.repeat(dots)}</span>;
}

/**
 * Header compartido por PLP y PDP (SPEC-004, CLAUDE.md §6): logo/título
 * enlazado a la PLP, breadcrumbs route-aware y contador de carrito desde
 * CartContext.
 */
function Header() {
  const { count } = useCart();
  const { title } = useProductTitle();
  const location = useLocation();
  const isProductDetail = location.pathname.startsWith('/product/');

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <img src={logo} alt="" className={styles.logo} />
        <span>Miniapp Móviles</span>
      </Link>

      <nav className={styles.breadcrumbs} aria-label="breadcrumb">
        <span>Inicio</span>
        {isProductDetail && (
          <>
            {' / '}
            {title ? <span>{title}</span> : <LoadingEllipsis />}
          </>
        )}
      </nav>

      <span className={styles.cart}>{count}</span>
    </header>
  );
}

export default Header;
