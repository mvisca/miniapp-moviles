import { createContext, useContext, useState, type ReactNode } from 'react'

interface ProductTitleContextValue {
  title: string | null
  setTitle: (title: string | null) => void
}

const ProductTitleContext = createContext<ProductTitleContextValue | undefined>(undefined)

/**
 * Contenedor de estado del título de producto para el breadcrumb de la PDP
 * (SPEC-006). Alcance mínimo: un `useState<string | null>` + setter, sin
 * lógica de negocio. `Header` lo consume para mostrar `‹marca› ‹modelo›` en
 * vez de la elipsis animada (`LoadingEllipsis`) una vez cargado el detalle
 * del producto (SPEC-006, TASK-006-4).
 */
export function ProductTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)

  return (
    <ProductTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </ProductTitleContext.Provider>
  )
}

// Patrón estándar de Context: Provider + hook conviven en el mismo archivo.
// eslint-disable-next-line react-refresh/only-export-components
export function useProductTitle(): ProductTitleContextValue {
  const context = useContext(ProductTitleContext)

  if (context === undefined) {
    throw new Error('useProductTitle debe usarse dentro de un ProductTitleProvider')
  }

  return context
}
