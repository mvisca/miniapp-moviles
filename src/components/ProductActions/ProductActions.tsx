import { useEffect, useRef, useState } from 'react'
import type { ProductDetail } from '../../types/domain'
import { getColorSwatches } from '../../utils/colorSwatches'
import { normalizeStorageName } from '../../utils/normalizeStorageName'
import styles from './ProductActions.module.css'

type Feedback = 'idle' | 'pending' | 'success' | 'error'

interface ProductActionsProps {
  product: ProductDetail
  /**
   * Hook opcional para SPEC-007 (mutación real contra `addToCart` de
   * `api/cart.ts`). Si no se provee, el click no hace nada (comportamiento
   * actual). Devuelve una promesa (SPEC-011): resolverla/rechazarla
   * conduce el feedback visual del botón (idle -> pending -> success|error
   * -> idle tras ~2s).
   */
  onAddToCart?: (selection: { colorCode?: number; storageCode?: number }) => Promise<void>
}

const FEEDBACK_LABEL: Record<Feedback, string> = {
  idle: 'Añadir al carrito',
  pending: 'Añadiendo…',
  success: '¡Ya está en el carrito!',
  error: 'No se pudo añadir, probá de nuevo',
}

/**
 * Preselección (CLAUDE.md §6): si hay una única opción, se preselecciona
 * — no hay nada que elegir. Si hay más de una, ninguna viene preseleccionada
 * hasta que el usuario elija explícitamente un botón.
 */
function defaultSelection<T extends { code: number }>(options: T[]): number | undefined {
  return options.length === 1 ? options[0].code : undefined
}

/** Círculo de color simple, o stack superpuesto si el nombre resuelve a >1 color. */
function ColorSwatch({ name }: { name: string }) {
  const swatches = getColorSwatches(name)

  if (!swatches) {
    return (
      <span className={styles.swatchStack}>
        <span className={`${styles.swatch} ${styles.swatchUnknown}`} aria-hidden="true">
          ✕
        </span>
      </span>
    )
  }

  return (
    <span className={styles.swatchStack}>
      {swatches.map((hex, i) => (
        <span
          key={`${hex}-${i}`}
          className={styles.swatch}
          style={{ background: hex, zIndex: swatches.length - i }}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/**
 * Presentacional (SPEC-006, CLAUDE.md §6/§4.1): opciones de storage y color
 * pobladas EXCLUSIVAMENTE desde `product.storages` / `product.colors` —
 * nunca un valor hardcodeado ni fuera de esa lista, para que el frontend
 * nunca pueda enviar un código inválido a `POST /api/cart`. Botones tipo
 * radio en vez de `<select>`: color con swatch (o stack, o X roja si el
 * nombre no resuelve a un color conocido — ver `getColorSwatches`) +
 * nombre debajo; storage con el nombre normalizado (`normalizeStorageName`)
 * — separados por una línea divisoria (vertical en desktop, horizontal en
 * mobile).
 *
 * Botón "Añadir al carrito" deshabilitado cuando `product.price` es `null`,
 * o mientras falte elegir color/storage en un grupo con más de una opción
 * (nada preseleccionado ahí, ver `defaultSelection`) — evita enviar un
 * `colorCode`/`storageCode` `undefined`, que el API rechaza con 400.
 *
 * Feedback de éxito/error (SPEC-011, TASK-011-2): estado local
 * `idle -> pending -> success | error -> idle` (revierte automáticamente
 * tras ~2s). El timeout de reversión se guarda en un `useRef` y se limpia
 * al desmontar, para evitar `setState` sobre un componente ya desmontado.
 */
function ProductActions({ product, onAddToCart }: ProductActionsProps) {
  const [storageCode, setStorageCode] = useState<number | undefined>(
    defaultSelection(product.storages),
  )
  const [colorCode, setColorCode] = useState<number | undefined>(defaultSelection(product.colors))
  const [feedback, setFeedback] = useState<Feedback>('idle')
  const revertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (revertTimeoutRef.current !== null) {
        clearTimeout(revertTimeoutRef.current)
      }
    }
  }, [])

  const isAvailable = product.price !== null
  const hasSelection =
    (product.storages.length === 0 || storageCode !== undefined) &&
    (product.colors.length === 0 || colorCode !== undefined)

  function scheduleRevertToIdle() {
    if (revertTimeoutRef.current !== null) {
      clearTimeout(revertTimeoutRef.current)
    }
    revertTimeoutRef.current = setTimeout(() => {
      setFeedback('idle')
      revertTimeoutRef.current = null
    }, 2000)
  }

  async function handleAddToCart() {
    if (!onAddToCart) return

    setFeedback('pending')
    try {
      await onAddToCart({ colorCode, storageCode })
      setFeedback('success')
    } catch {
      setFeedback('error')
    }
    scheduleRevertToIdle()
  }

  return (
    <div className={styles.actions}>
      <div className={styles.optionGroups}>
        <div className={styles.field} role="radiogroup" aria-label="Color">
          <span className={styles.label}>Color</span>
          <div className={styles.optionButtons}>
            {product.colors.map((color) => (
              <button
                key={color.code}
                type="button"
                role="radio"
                aria-checked={colorCode === color.code}
                className={`${styles.optionButton} ${
                  colorCode === color.code ? styles.optionButtonSelected : ''
                }`}
                onClick={() => setColorCode(color.code)}
              >
                <ColorSwatch name={color.name} />
                <span className={styles.optionName}>{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.field} role="radiogroup" aria-label="Almacenamiento">
          <span className={styles.label}>Almacenamiento</span>
          <div className={styles.optionButtons}>
            {product.storages.map((storage) => (
              <button
                key={storage.code}
                type="button"
                role="radio"
                aria-checked={storageCode === storage.code}
                className={`${styles.optionButton} ${
                  storageCode === storage.code ? styles.optionButtonSelected : ''
                }`}
                onClick={() => setStorageCode(storage.code)}
              >
                <span className={styles.optionName}>{normalizeStorageName(storage.name)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`${styles.addButton} ${feedback === 'pending' ? styles.addButtonPending : ''} ${
          feedback === 'success' ? styles.addButtonSuccess : ''
        } ${feedback === 'error' ? styles.addButtonError : ''}`}
        disabled={!isAvailable || !hasSelection || feedback === 'pending'}
        onClick={handleAddToCart}
      >
        {feedback === 'pending' ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles.srOnly}>{FEEDBACK_LABEL.pending}</span>
          </>
        ) : isAvailable ? (
          FEEDBACK_LABEL[feedback]
        ) : (
          'Añadir al carrito'
        )}
      </button>
    </div>
  )
}

export default ProductActions
