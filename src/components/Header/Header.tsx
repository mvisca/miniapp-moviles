import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.svg'
import { useCart } from '../../context/CartContext'
import { useProductTitle } from '../../context/ProductTitleContext'
import styles from './Header.module.css'

/**
 * Segundo segmento del breadcrumb en la PDP mientras el detalle del
 * producto está en curso de carga: elipsis animada `.` -> `..` -> `...`,
 * en loop (CLAUDE.md §6). SPEC-006 reemplaza este placeholder por
 * `‹marca› ‹modelo›` una vez exista el dato real — fuera de alcance aquí.
 */
function LoadingEllipsis() {
  const [dots, setDots] = useState(1)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDots((prev) => (prev % 3) + 1)
    }, 500)

    return () => clearInterval(intervalId)
  }, [])

  return <span data-testid="breadcrumb-ellipsis">{'.'.repeat(dots)}</span>
}

/**
 * Header compartido por PLP y PDP (SPEC-004, CLAUDE.md §6): logo/título
 * enlazado a la PLP, breadcrumbs route-aware y contador de carrito desde
 * CartContext.
 */
function Header() {
  const { count } = useCart()
  const { title } = useProductTitle()
  const location = useLocation()
  const isProductDetail = location.pathname.startsWith('/product/')

  const isFirstRender = useRef(true)
  const [isBouncing, setIsBouncing] = useState(false)

  // Bounce de tamaño del indicador de carrito cada vez que `count` cambia
  // (SPEC-011/CLAUDE.md §6) — no en el montaje inicial (restaurar
  // `cartCount` de localStorage no debe animar). `onAnimationEnd` saca la
  // clase para poder re-disparar la animación en el próximo cambio.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setIsBouncing(true)
  }, [count])

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.row}>
          <Link to="/" className={styles.brand}>
            <img src={logo} alt="" className={styles.logo} />
            <span>Miniapp Móviles</span>
          </Link>

          <span
            className={`${styles.cart} ${isBouncing ? styles.cartBounce : ''}`}
            onAnimationEnd={() => setIsBouncing(false)}
          >
            <span aria-hidden="true">🛒</span>
            <span>{count}</span>
          </span>
        </div>

        <nav className={styles.breadcrumbs} aria-label="breadcrumb">
          <Link to="/">Inicio</Link>
          {isProductDetail && (
            <>
              {' / '}
              {title ? <span>{title}</span> : <LoadingEllipsis />}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
