import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Product } from '../../types/domain';
import ProductItem from './ProductItem';

// TDD baseline (TASK-005-0, ver sección "Tests required" de SPEC-005):
// - renderiza marca/modelo/precio.
// - price: null -> "No disponible" + acción marcada como deshabilitada
//   (el link a la PDP sigue siendo navegable, ver CLAUDE.md §4.1 / plan_content).

const baseProduct: Product = {
  id: 'abc123',
  brand: 'Acer',
  model: 'Liquid E700',
  price: 299,
  imgUrl: 'https://example.com/img.png',
};

function renderProductItem(product: Product) {
  return render(
    <MemoryRouter>
      <ProductItem product={product} />
    </MemoryRouter>,
  );
}

describe('ProductItem', () => {
  it('renderiza marca, modelo y precio', () => {
    renderProductItem(baseProduct);

    expect(screen.getByText(/Acer/)).toBeInTheDocument();
    expect(screen.getByText(/Liquid E700/)).toBeInTheDocument();
    expect(screen.getByText(/299/)).toBeInTheDocument();
  });

  it('renderiza la imagen con alt = marca + modelo', () => {
    renderProductItem(baseProduct);

    const img = screen.getByRole('img', { name: 'Acer Liquid E700' });
    expect(img).toHaveAttribute('src', baseProduct.imgUrl);
  });

  it('enlaza a la PDP del producto', () => {
    renderProductItem(baseProduct);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/product/abc123');
  });

  it('price: null -> muestra "No disponible" y marca la acción como deshabilitada, sin bloquear la navegación', () => {
    renderProductItem({ ...baseProduct, price: null });

    expect(screen.getByText('No disponible')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    // La navegación a la PDP sigue habilitada: el href debe seguir presente.
    expect(link).toHaveAttribute('href', '/product/abc123');
  });

  it('cuando hay precio, no marca la acción como deshabilitada', () => {
    renderProductItem(baseProduct);

    const link = screen.getByRole('link');
    expect(link).not.toHaveAttribute('aria-disabled', 'true');
  });
});
