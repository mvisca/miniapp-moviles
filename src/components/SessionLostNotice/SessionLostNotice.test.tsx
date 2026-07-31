import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addToCart } from '../../api/cart'
import { CartProvider, useCart } from '../../context/CartContext'
import { setCartCount } from '../../utils/cache'
import SessionLostNotice from './SessionLostNotice'

vi.mock('../../api/cart')

const mockedAddToCart = vi.mocked(addToCart)

// TDD baseline: el aviso de sesión perdida (CLAUDE.md §3) no vive más en
// Header -- se renderiza donde CartProvider lo exponga, efímero (se
// autodescarta) y solo cuando `sessionLostNotice` no es null.

function TriggerAddItem() {
  const { addItem } = useCart()
  return (
    <button type="button" onClick={() => addItem('some-id', 1, 2)}>
      add
    </button>
  )
}

describe('SessionLostNotice', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedAddToCart.mockReset()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('no renderiza nada sin aviso de sesión perdida', () => {
    render(
      <CartProvider>
        <SessionLostNotice />
      </CartProvider>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('muestra el aviso cuando la sesión se pierde y se autodescarta', async () => {
    setCartCount(5)
    mockedAddToCart.mockResolvedValue(1)

    render(
      <CartProvider>
        <TriggerAddItem />
        <SessionLostNotice />
      </CartProvider>,
    )

    await act(async () => {
      screen.getByRole('button').click()
    })

    expect(
      screen.getByText('Se perdió el carrito anterior, se inició uno nuevo.'),
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })
})
