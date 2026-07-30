import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../types/domain';
import ProductListPage from './ProductListPage';

// TDD baseline (TASK-005-2, ver "Tests required" de SPEC-005):
// - muestra loading y luego la grilla (fetch mockeado).
// - muestra estado de error con reintento cuando el fetch falla.
// - buscador filtra en tiempo real; sin matches -> estado vacío, sin ocultar
//   el buscador ni resetear el término (CLAUDE.md §6).
vi.mock('../../api/products');

import { getProducts } from '../../api/products';

const getProductsMock = vi.mocked(getProducts);

const products: Product[] = [
  { id: '1', brand: 'Acer', model: 'Liquid E700', price: 299, imgUrl: 'https://example.com/1.png' },
  { id: '2', brand: 'Samsung', model: 'Galaxy S9', price: null, imgUrl: 'https://example.com/2.png' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ProductListPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('ProductListPage', () => {
  it('muestra "Cargando productos..." mientras el fetch está en curso, luego la grilla', async () => {
    let resolveFn: (value: Product[]) => void;
    getProductsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      }),
    );

    renderPage();

    expect(screen.getByText('Cargando productos...')).toBeInTheDocument();

    resolveFn!(products);

    await waitFor(() => {
      expect(screen.getByText('Acer')).toBeInTheDocument();
    });

    expect(screen.getByText('Samsung')).toBeInTheDocument();
    expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
  });

  it('muestra un mensaje de error con botón de reintentar cuando el fetch falla', async () => {
    getProductsMock.mockRejectedValueOnce(new Error('network error'));

    renderPage();

    const retryButton = await screen.findByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();

    getProductsMock.mockResolvedValueOnce(products);
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Acer')).toBeInTheDocument();
    });
    expect(getProductsMock).toHaveBeenCalledTimes(2);
  });

  it('filtra la grilla en tiempo real por marca + modelo', async () => {
    getProductsMock.mockResolvedValueOnce(products);

    renderPage();

    await screen.findByText('Acer');

    const input = screen.getByLabelText(/buscar por marca o modelo/i);
    await userEvent.type(input, 'samsung');

    expect(screen.queryByText('Acer')).not.toBeInTheDocument();
    expect(screen.getByText('Samsung')).toBeInTheDocument();
  });

  it('sin matches muestra el estado vacío, sin ocultar el buscador ni resetear el término', async () => {
    getProductsMock.mockResolvedValueOnce(products);

    renderPage();

    await screen.findByText('Acer');

    const input = screen.getByLabelText(/buscar por marca o modelo/i);
    await userEvent.type(input, 'nokia');

    expect(screen.getByText('No se encontraron resultados para «nokia»')).toBeInTheDocument();
    expect(screen.queryByText('Acer')).not.toBeInTheDocument();
    expect(screen.queryByText('Samsung')).not.toBeInTheDocument();
    expect(input).toHaveValue('nokia');
  });
});
