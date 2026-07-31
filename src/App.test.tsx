import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// Smoke test de routing: App monta bajo MemoryRouter y navega de la PLP
// real (TASK-005-2 reemplazó el placeholder) a la PDP real (TASK-006-4
// reemplazó el placeholder) vía el link de un ProductItem hacia
// /product/:id. getProducts/getProductDetail se mockean porque ambas
// páginas fetchean datos reales en un useEffect. El test de integración
// completo PLP -> PDP (contenido real del detalle) es TASK-006-5; acá solo
// se verifica que la navegación ocurre y la PDP monta.
vi.mock('./api/products')

import { getProductDetail, getProducts } from './api/products'

const getProductsMock = vi.mocked(getProducts)
const getProductDetailMock = vi.mocked(getProductDetail)

afterEach(() => {
  vi.resetAllMocks()
})

describe('App routing shell', () => {
  it('renders the ProductListPage grid at /', async () => {
    getProductsMock.mockResolvedValueOnce([
      {
        id: 'example-id',
        brand: 'Acer',
        model: 'Liquid E700',
        price: 299,
        imgUrl: 'https://example.com/1.png',
      },
    ])

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Acer')).toBeInTheDocument()
  })

  it('navigates from / to /product/:id and mounts the ProductDetailPage', async () => {
    getProductsMock.mockResolvedValueOnce([
      {
        id: 'example-id',
        brand: 'Acer',
        model: 'Liquid E700',
        price: 299,
        imgUrl: 'https://example.com/1.png',
      },
    ])
    getProductDetailMock.mockReturnValue(new Promise(() => {}))

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const link = await screen.findByRole('link', { name: /acer/i })
    await user.click(link)

    expect(screen.getByText('Cargando producto...')).toBeInTheDocument()
  })
})
