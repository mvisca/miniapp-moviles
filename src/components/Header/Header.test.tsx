import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CartProvider } from '../../context/CartContext'
import { ProductTitleProvider, useProductTitle } from '../../context/ProductTitleContext'
import { setCartCount } from '../../utils/cache'
import Header from './Header'

// TDD baseline (TASK-004-1, ver sección "Tests required" de SPEC-004,
// TASK-006-0 para el consumo de ProductTitleContext):
// - el contador refleja el count del CartContext (no se mockea el contexto,
//   se envuelve con un CartProvider real).
// - el logo/título enlaza a '/'.
// - el breadcrumb corresponde a la ruta: 'Inicio' en PLP.
// - en la PDP, el segundo segmento del breadcrumb muestra el título del
//   producto cuando ProductTitleContext tiene un valor, y la elipsis
//   animada cuando es null (TASK-006-4 es quien lo puebla vía
//   ProductDetailPage — fuera de alcance aquí).

function renderHeaderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <ProductTitleProvider>
          <Routes>
            <Route path="*" element={<Header />} />
          </Routes>
        </ProductTitleProvider>
      </CartProvider>
    </MemoryRouter>,
  )
}

// Setea el título vía el hook real (no se mockea el contexto) antes de
// renderizar el Header, simulando el estado que TASK-006-4 produciría.
function SetTitleThenHeader({ title }: { title: string }) {
  const { setTitle } = useProductTitle()

  useEffect(() => {
    setTitle(title)
  }, [setTitle, title])

  return <Header />
}

function renderHeaderWithTitleAt(path: string, title: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <ProductTitleProvider>
          <Routes>
            <Route path="*" element={<SetTitleThenHeader title={title} />} />
          </Routes>
        </ProductTitleProvider>
      </CartProvider>
    </MemoryRouter>,
  )
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('refleja el count del CartContext', () => {
    setCartCount(3)

    renderHeaderAt('/')

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('el logo/título enlaza a la PLP (/)', () => {
    renderHeaderAt('/')

    const logoLink = screen.getByRole('link', { name: /miniapp/i })
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('muestra el breadcrumb "Inicio" en la PLP', () => {
    renderHeaderAt('/')

    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('muestra una elipsis animada como segundo segmento del breadcrumb en la PDP cuando ProductTitleContext es null', () => {
    renderHeaderAt('/product/example-id')

    expect(screen.getByText('Inicio')).toBeInTheDocument()
    // Segundo segmento: elipsis animada, un único carácter '.' repetido
    // (1 a 3 puntos) mientras no hay datos reales del producto (SPEC-006).
    const ellipsis = screen.getByTestId('breadcrumb-ellipsis')
    expect(ellipsis.textContent).toMatch(/^\.{1,3}$/)
  })

  it('muestra el título del producto como segundo segmento del breadcrumb en la PDP cuando ProductTitleContext tiene un valor', () => {
    renderHeaderWithTitleAt('/product/example-id', 'Acer Liquid E700')

    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Acer Liquid E700')).toBeInTheDocument()
    expect(screen.queryByTestId('breadcrumb-ellipsis')).not.toBeInTheDocument()
  })
})
