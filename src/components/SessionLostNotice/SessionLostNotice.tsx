import { useEffect } from 'react'
import { useCart } from '../../context/CartContext'
import styles from './SessionLostNotice.module.css'

const AUTO_DISMISS_MS = 4000

/**
 * Aviso efímero de sesión de carrito perdida (CLAUDE.md §3). Se renderiza
 * dentro de `<main>` (App.tsx), no en `Header` — posicionado en la esquina
 * superior derecha del contenedor de página, debajo de donde cae el
 * contador de carrito en el navbar. Se autodescarta a los 4s vía
 * `clearSessionLostNotice`; también puede cerrarse a mano.
 */
function SessionLostNotice() {
  const { sessionLostNotice, clearSessionLostNotice } = useCart()

  useEffect(() => {
    if (!sessionLostNotice) return

    const timeoutId = setTimeout(clearSessionLostNotice, AUTO_DISMISS_MS)

    return () => clearTimeout(timeoutId)
  }, [sessionLostNotice, clearSessionLostNotice])

  if (!sessionLostNotice) {
    return null
  }

  return (
    <div className={`${styles.notice} fadeIn`} role="status">
      {sessionLostNotice}
    </div>
  )
}

export default SessionLostNotice
