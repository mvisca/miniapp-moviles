import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product } from '../../types/domain'
import ProductListPage from './ProductListPage'

// TDD baseline (TASK-005-2, ver "Tests required" de SPEC-005):
// - muestra loading y luego la grilla (fetch mockeado).
// - muestra estado de error con reintento cuando el fetch falla.
// - buscador filtra en tiempo real; sin matches -> estado vacío, sin ocultar
//   el buscador ni resetear el término (CLAUDE.md §6).
vi.mock('../../api/products')

import { getProductDetail, getProducts } from '../../api/products'
import type { ProductDetail } from '../../types/domain'
import App from '../../App'

const getProductsMock = vi.mocked(getProducts)
const getProductDetailMock = vi.mocked(getProductDetail)

const products: Product[] = [
  { id: '1', brand: 'Acer', model: 'Liquid E700', price: 299, imgUrl: 'https://example.com/1.png' },
  {
    id: '2',
    brand: 'Samsung',
    model: 'Galaxy S9',
    price: null,
    imgUrl: 'https://example.com/2.png',
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <ProductListPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('ProductListPage', () => {
  it('muestra "Cargando productos..." mientras el fetch está en curso, luego la grilla', async () => {
    let resolveFn: (value: Product[]) => void
    getProductsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve
      }),
    )

    renderPage()

    expect(screen.getByText('Cargando productos...')).toBeInTheDocument()

    resolveFn!(products)

    await waitFor(() => {
      expect(screen.getByText('Acer')).toBeInTheDocument()
    })

    expect(screen.getByText('Samsung')).toBeInTheDocument()
    expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument()
  })

  // TDD (TASK-011-3, ver SPEC-011 "Tests required" sección
  // ProductListPage/ProductDetailPage): el fetch simple se reemplaza por
  // useRetryingFetch con backoff lineal [2,4,6,8,10]s. Un solo fallo ya no
  // cae directo a error manual -- pasa primero por 'retrying'.
  describe('reintentos automáticos con backoff (SPEC-011)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('reintenta automáticamente tras un fallo inicial y termina en éxito sin intervención del usuario', async () => {
      getProductsMock
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce(products)

      renderPage()

      // Falla el intento inicial -> pasa a 'retrying' con countdown, sin
      // que el usuario haga nada.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByText(/reintentando en 2s/i)).toBeInTheDocument()

      // Se cumple el delay de 2s -> segundo intento, que resuelve con éxito.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Acer')).toBeInTheDocument()
      expect(screen.queryByText(/reintentando en/i)).not.toBeInTheDocument()
      expect(getProductsMock).toHaveBeenCalledTimes(2)
    })

    it('agota los reintentos automáticos y cae al estado de error manual con botón "Reintentar"', async () => {
      getProductsMock.mockRejectedValue(new Error('network error'))

      renderPage()

      // Intento inicial + 5 reintentos automáticos (delays 2,4,6,8,10s).
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(8000)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000)
      })

      const retryButton = screen.getByRole('button', { name: /reintentar/i })
      expect(retryButton).toBeInTheDocument()
      expect(getProductsMock).toHaveBeenCalledTimes(6)

      // El botón "Reintentar" ahora llama a retry() del hook, que reinicia
      // el ciclo completo desde el intento 1.
      getProductsMock.mockResolvedValueOnce(products)

      await act(async () => {
        fireEvent.click(retryButton)
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByText('Acer')).toBeInTheDocument()
      expect(getProductsMock).toHaveBeenCalledTimes(7)
    })
  })

  it('filtra la grilla en tiempo real por marca + modelo', async () => {
    getProductsMock.mockResolvedValueOnce(products)

    renderPage()

    await screen.findByText('Acer')

    const input = screen.getByLabelText(/buscar por marca o modelo/i)
    await userEvent.type(input, 'samsung')

    expect(screen.queryByText('Acer')).not.toBeInTheDocument()
    expect(screen.getByText('Samsung')).toBeInTheDocument()
  })

  it('sin matches muestra el estado vacío, sin ocultar el buscador ni resetear el término', async () => {
    getProductsMock.mockResolvedValueOnce(products)

    renderPage()

    await screen.findByText('Acer')

    const input = screen.getByLabelText(/buscar por marca o modelo/i)
    await userEvent.type(input, 'nokia')

    expect(screen.getByText('No se encontraron resultados para «nokia»')).toBeInTheDocument()
    expect(screen.queryByText('Acer')).not.toBeInTheDocument()
    expect(screen.queryByText('Samsung')).not.toBeInTheDocument()
    expect(input).toHaveValue('nokia')
  })
})

// Integración PLP -> PDP (TASK-006-5, ver "Tests required" de SPEC-006):
// click en un ProductItem navega al detalle correcto. Renderiza la app
// completa (mismo patrón de routing que App.tsx: '/' -> ProductListPage,
// '/product/:id' -> ProductDetailPage) para ejercitar la navegación real de
// React Router, no solo el atributo `to` del Link (ya cubierto por
// ProductItem.test.tsx).
const productDetail: ProductDetail = {
  id: '1',
  brand: 'Acer',
  model: 'Liquid E700',
  price: 299,
  imgUrl: 'https://example.com/1.png',
  cpu: 'ST Ericsson PNX6715',
  ram: '2 GB RAM or 4 GB',
  os: 'Android 4.4.4 (KitKat)',
  screenResolution: '480 x 854 pixels',
  battery: '1500 mAh',
  rearCamera: '5 MP',
  frontCamera: 'No',
  dimensions: '123 x 62 x 11.5 mm',
  weight: '135 g',
  colors: [{ code: 1, name: 'Negro' }],
  storages: [{ code: 1, name: '4 GB' }],
}

describe('Integración PLP -> PDP', () => {
  it('click en un ProductItem navega al detalle correcto', async () => {
    getProductsMock.mockResolvedValueOnce(products)
    getProductDetailMock.mockResolvedValueOnce(productDetail)

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByText('Acer')

    const link = screen.getByRole('link', { name: /Acer.*Liquid E700/s })
    await userEvent.click(link)

    expect(await screen.findByRole('heading', { name: 'Liquid E700' })).toBeInTheDocument()
    expect(getProductDetailMock).toHaveBeenCalledWith('1')
  })
})
