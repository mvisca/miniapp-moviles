import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

// Smoke test de routing (TASK-002-2): App monta bajo MemoryRouter y navega
// de la PLP placeholder a la PDP placeholder vía un link a /product/:id.
describe('App routing shell', () => {
  it('renders the ProductListPage placeholder at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText(/ProductListPage/i)).toBeInTheDocument()
  })

  it('navigates from / to /product/:id and renders the ProductDetailPage placeholder', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('link', { name: /product/i }))

    expect(screen.getByText(/ProductDetailPage/i)).toBeInTheDocument()
  })
})
