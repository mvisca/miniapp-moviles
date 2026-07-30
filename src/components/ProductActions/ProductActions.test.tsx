import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductDetail } from '../../types/domain';
import ProductActions from './ProductActions';

// TDD baseline (TASK-006-3, ver sección "Tests required" de SPEC-006):
// - selectores de color/storage poblados EXCLUSIVAMENTE desde `options`
//   (product.colors / product.storages), nunca un valor hardcodeado.
// - botón "Añadir al carrito" deshabilitado cuando price es null
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
};

describe('ProductActions', () => {
  it('puebla el selector de storage exclusivamente desde product.storages', () => {
    render(<ProductActions product={baseProduct} />);
    const select = screen.getByLabelText(/almacenamiento/i);
    const options = Array.from(select.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    expect(options).toEqual(['8 GB', '16 GB']);
  });

  it('puebla el selector de color exclusivamente desde product.colors', () => {
    render(<ProductActions product={baseProduct} />);
    const select = screen.getByLabelText(/color/i);
    const options = Array.from(select.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    expect(options).toEqual(['Black', 'White']);
  });

  it('selecciona por defecto el primer storage y color disponibles', () => {
    render(<ProductActions product={baseProduct} />);
    const storageSelect = screen.getByLabelText(
      /almacenamiento/i,
    ) as HTMLSelectElement;
    const colorSelect = screen.getByLabelText(/color/i) as HTMLSelectElement;
    expect(storageSelect.value).toBe('10');
    expect(colorSelect.value).toBe('1');
  });

  it('permite cambiar la selección de storage y color', async () => {
    const user = userEvent.setup();
    render(<ProductActions product={baseProduct} />);
    const storageSelect = screen.getByLabelText(
      /almacenamiento/i,
    ) as HTMLSelectElement;
    const colorSelect = screen.getByLabelText(/color/i) as HTMLSelectElement;

    await user.selectOptions(storageSelect, '20');
    await user.selectOptions(colorSelect, '2');

    expect(storageSelect.value).toBe('20');
    expect(colorSelect.value).toBe('2');
  });

  it('el botón "Añadir al carrito" está habilitado cuando price no es null', () => {
    render(<ProductActions product={baseProduct} />);
    expect(
      screen.getByRole('button', { name: /añadir al carrito/i }),
    ).toBeEnabled();
  });

  it('el botón "Añadir al carrito" está deshabilitado cuando price es null', () => {
    render(<ProductActions product={{ ...baseProduct, price: null }} />);
    expect(
      screen.getByRole('button', { name: /añadir al carrito/i }),
    ).toBeDisabled();
  });

  it('no rompe si options.colors/storages vienen vacíos', () => {
    render(
      <ProductActions product={{ ...baseProduct, colors: [], storages: [] }} />,
    );
    const storageSelect = screen.getByLabelText(
      /almacenamiento/i,
    ) as HTMLSelectElement;
    const colorSelect = screen.getByLabelText(/color/i) as HTMLSelectElement;
    expect(storageSelect.querySelectorAll('option')).toHaveLength(0);
    expect(colorSelect.querySelectorAll('option')).toHaveLength(0);
  });

  // TDD (TASK-011-2, ver SPEC-011 "Tests required" sección ProductActions):
  // feedback local idle -> pending -> success|error -> idle tras ~2s.
  // onAddToCart pasa a `(selection) => Promise<void>`.
  describe('feedback de éxito/error al añadir al carrito', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('click con onAddToCart que resuelve: pending -> success -> vuelve a idle tras ~2s', async () => {
      let resolveAdd: () => void = () => {};
      const onAddToCart = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAdd = resolve;
          }),
      );

      render(<ProductActions product={baseProduct} onAddToCart={onAddToCart} />);
      const button = screen.getByRole('button', { name: /añadir al carrito/i });

      await act(async () => {
        fireEvent.click(button);
        await Promise.resolve();
      });

      expect(
        screen.getByRole('button', { name: /añadiendo/i }),
      ).toBeDisabled();

      await act(async () => {
        resolveAdd();
        await Promise.resolve();
      });

      expect(
        screen.getByRole('button', { name: /añadido al carrito/i }),
      ).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(
        screen.getByRole('button', { name: /^añadir al carrito$/i }),
      ).toBeInTheDocument();
    });

    it('click con onAddToCart que rechaza: pending -> error -> vuelve a idle tras ~2s', async () => {
      let rejectAdd: () => void = () => {};
      const onAddToCart = vi.fn(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectAdd = reject;
          }),
      );

      render(<ProductActions product={baseProduct} onAddToCart={onAddToCart} />);
      const button = screen.getByRole('button', { name: /añadir al carrito/i });

      await act(async () => {
        fireEvent.click(button);
        await Promise.resolve();
      });

      expect(
        screen.getByRole('button', { name: /añadiendo/i }),
      ).toBeDisabled();

      await act(async () => {
        rejectAdd();
        await Promise.resolve().catch(() => {});
      });

      expect(
        screen.getByRole('button', { name: /no se pudo añadir/i }),
      ).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(
        screen.getByRole('button', { name: /^añadir al carrito$/i }),
      ).toBeInTheDocument();
    });
  });
});
