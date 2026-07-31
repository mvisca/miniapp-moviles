import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductDetail } from '../../types/domain'
import ProductActions from './ProductActions'

// TDD baseline (TASK-006-3 / rediseño de botones, ver CLAUDE.md §6):
// - opciones de color/storage pobladas EXCLUSIVAMENTE desde `options`
//   (product.colors / product.storages), nunca un valor hardcodeado.
// - si hay una única opción se preselecciona; si hay más de una, ninguna
//   viene preseleccionada hasta que el usuario elige.
// - botón "Añadir al carrito" deshabilitado cuando price es null, o
//   mientras falte elegir color/storage en un grupo con >1 opción
//   (CLAUDE.md §4.2 / §6).

const baseProduct: ProductDetail = {
  id: 'abc123',
  brand: 'Acer',
  model: 'Liquid E700',
  price: 299,
  imgUrl: 'https://example.com/abc123.png',
  cpu: 'ST Ericsson PNX6715',
  ram: '2 GB RAM',
  os: 'Android 4.4.4 (KitKat)',
  screenResolution: '480 x 854 pixels',
  battery: '1500 mAh',
  rearCamera: '5 MP',
  frontCamera: 'VGA',
  dimensions: '123 x 62 x 12 mm',
  weight: '120 g',
  colors: [
    { code: 1, name: 'Black' },
    { code: 2, name: 'White' },
  ],
  storages: [
    { code: 10, name: '8 GB' },
    { code: 20, name: '16 GB' },
  ],
}

const singleOptionProduct: ProductDetail = {
  ...baseProduct,
  colors: [{ code: 1, name: 'Black' }],
  storages: [{ code: 10, name: '8 GB' }],
}

describe('ProductActions', () => {
  it('puebla los botones de storage exclusivamente desde product.storages', () => {
    render(<ProductActions product={baseProduct} />)
    const group = screen.getByRole('radiogroup', { name: /almacenamiento/i })
    const names = within(group)
      .getAllByRole('radio')
      .map((btn) => btn.textContent)
    expect(names).toEqual(['8 GB', '16 GB'])
  })

  it('puebla los botones de color exclusivamente desde product.colors', () => {
    render(<ProductActions product={baseProduct} />)
    const group = screen.getByRole('radiogroup', { name: /^color$/i })
    const names = within(group)
      .getAllByRole('radio')
      .map((btn) => btn.textContent)
    expect(names).toEqual(['Black', 'White'])
  })

  it('con una única opción de color y storage, ambas quedan preseleccionadas', () => {
    render(<ProductActions product={singleOptionProduct} />)
    expect(screen.getByRole('radio', { name: /black/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /8 gb/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('con más de una opción, ninguna viene preseleccionada', () => {
    render(<ProductActions product={baseProduct} />)
    const radios = screen.getAllByRole('radio')
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('aria-checked', 'false')
    })
  })

  it('permite elegir storage y color clickeando los botones', async () => {
    const user = userEvent.setup()
    render(<ProductActions product={baseProduct} />)

    await user.click(screen.getByRole('radio', { name: /16 gb/i }))
    await user.click(screen.getByRole('radio', { name: /white/i }))

    expect(screen.getByRole('radio', { name: /16 gb/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /white/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('muestra "N/A" para un storage con nombre en blanco, sin perder el code real', async () => {
    const user = userEvent.setup()
    const product: ProductDetail = {
      ...baseProduct,
      storages: [{ code: 2000, name: ' ' }],
      colors: [{ code: 1, name: 'Black' }],
    }
    const onAddToCart = vi.fn(() => Promise.resolve())
    render(<ProductActions product={product} onAddToCart={onAddToCart} />)

    expect(screen.getByRole('radio', { name: 'N/A' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /añadir al carrito/i }))

    expect(onAddToCart).toHaveBeenCalledWith({ colorCode: 1, storageCode: 2000 })
  })

  it('el botón "Añadir al carrito" está deshabilitado cuando price es null', () => {
    render(<ProductActions product={{ ...baseProduct, price: null }} />)
    expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeDisabled()
  })

  it('el botón "Añadir al carrito" está deshabilitado hasta elegir color y storage', async () => {
    const user = userEvent.setup()
    render(<ProductActions product={baseProduct} />)

    expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: /black/i }))
    expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: /8 gb/i }))
    expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeEnabled()
  })

  it('el botón "Añadir al carrito" está habilitado de entrada cuando hay una única opción de cada uno', () => {
    render(<ProductActions product={singleOptionProduct} />)
    expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeEnabled()
  })

  it('no rompe si options.colors/storages vienen vacíos, y habilita el botón igual', () => {
    render(<ProductActions product={{ ...baseProduct, colors: [], storages: [] }} />)
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeEnabled()
  })

  // TDD (TASK-011-2, ver SPEC-011 "Tests required" sección ProductActions):
  // feedback local idle -> pending -> success|error -> idle tras ~2s.
  // onAddToCart pasa a `(selection) => Promise<void>`.
  describe('feedback de éxito/error al añadir al carrito', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('click con onAddToCart que resuelve: pending -> success -> vuelve a idle tras ~2s', async () => {
      let resolveAdd: () => void = () => {}
      const onAddToCart = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAdd = resolve
          }),
      )

      render(<ProductActions product={singleOptionProduct} onAddToCart={onAddToCart} />)
      const button = screen.getByRole('button', { name: /añadir al carrito/i })

      await act(async () => {
        fireEvent.click(button)
        await Promise.resolve()
      })

      expect(screen.getByRole('button', { name: /añadiendo/i })).toBeDisabled()

      await act(async () => {
        resolveAdd()
        await Promise.resolve()
      })

      expect(screen.getByRole('button', { name: /ya está en el carrito/i })).toBeInTheDocument()

      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      expect(screen.getByRole('button', { name: /^añadir al carrito$/i })).toBeInTheDocument()
    })

    it('click con onAddToCart que rechaza: pending -> error -> vuelve a idle tras ~2s', async () => {
      let rejectAdd: () => void = () => {}
      const onAddToCart = vi.fn(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectAdd = reject
          }),
      )

      render(<ProductActions product={singleOptionProduct} onAddToCart={onAddToCart} />)
      const button = screen.getByRole('button', { name: /añadir al carrito/i })

      await act(async () => {
        fireEvent.click(button)
        await Promise.resolve()
      })

      expect(screen.getByRole('button', { name: /añadiendo/i })).toBeDisabled()

      await act(async () => {
        rejectAdd()
        await Promise.resolve().catch(() => {})
      })

      expect(screen.getByRole('button', { name: /no se pudo añadir/i })).toBeInTheDocument()

      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      expect(screen.getByRole('button', { name: /^añadir al carrito$/i })).toBeInTheDocument()
    })
  })
})
