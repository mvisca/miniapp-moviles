import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { CartProvider } from '../../context/CartContext';
import { ProductTitleProvider } from '../../context/ProductTitleContext';
import type { ProductDetail } from '../../types/domain';
import ProductDetailPage from './ProductDetailPage';

// TDD baseline (TASK-006-4, ver "Tests required" de SPEC-006):
// - renderiza los specs del producto (incluida `screenResolution`, que ya
//   viene corregida del swap `displaySize`/`displayResolution` por
//   `mapProductDetail`).
// - 404 (ApiError con status 404) -> mensaje "Producto no encontrado" + link
//   a la PLP.
// - loading -> mensaje simple mientras el fetch está en curso.
// - error genérico -> mensaje de error.
//
// TASK-007-2 agrega: click en "Añadir al carrito" invoca `addToCart`
// (mockeado) con el id del producto y los códigos de color/almacenamiento
// inicialmente seleccionados (los primeros de `options`).

vi.mock('../../api/products');
vi.mock('../../api/cart');
import { getProductDetail } from '../../api/products';
import { addToCart } from '../../api/cart';

const getProductDetailMock = vi.mocked(getProductDetail);
const addToCartMock = vi.mocked(addToCart);

const product: ProductDetail = {
  id: '1',
  brand: 'Acer',
  model: 'Liquid E700',
  price: 299,
  imgUrl: 'https://example.com/1.png',
  cpu: 'ST Ericsson PNX6715, 416 MHz',
  ram: '2 GB RAM or 4 GB, 1 GB RAM',
  os: 'Android 4.4.4 (KitKat), upgradable to 5.1 (Lollipop)',
  screenResolution: '480 x 854 pixels',
  battery: '1420 mAh',
  rearCamera: '5 MP',
  frontCamera: 'VGA',
  dimensions: '123 x 62 x 12 mm',
  weight: '150 g',
  colors: [{ code: 1, name: 'Negro' }],
  storages: [{ code: 1, name: '8GB' }],
};

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

function renderPage(id = '1') {
  return render(
    <CartProvider>
      <ProductTitleProvider>
        <MemoryRouter initialEntries={[`/product/${id}`]}>
          <Routes>
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/" element={<p>PLP</p>} />
          </Routes>
        </MemoryRouter>
      </ProductTitleProvider>
    </CartProvider>,
  );
}

describe('ProductDetailPage', () => {
  it('muestra "Cargando producto..." mientras el fetch está en curso', () => {
    getProductDetailMock.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Cargando producto...')).toBeInTheDocument();
  });

  it('renderiza los tres bloques con los specs del producto tras el fetch', async () => {
    getProductDetailMock.mockResolvedValueOnce(product);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Acer')).toBeInTheDocument();
    });

    expect(screen.getByText('Liquid E700')).toBeInTheDocument();
    // `screenResolution` ya viene corregida del swap displaySize/displayResolution.
    expect(screen.getByText('480 x 854 pixels')).toBeInTheDocument();
    expect(screen.getByText('5 MP')).toBeInTheDocument();
    expect(screen.getByText('VGA')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Acer Liquid E700' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /añadir al carrito/i })).toBeInTheDocument();
  });

  it('muestra "Producto no encontrado" + link a la PLP cuando la API responde 404', async () => {
    getProductDetailMock.mockRejectedValueOnce(new ApiError(404, 'Not found'));

    renderPage('inexistente');

    expect(await screen.findByText('Producto no encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al listado/i })).toBeInTheDocument();
  });

  it('muestra un mensaje de error genérico ante un fallo que no es 404', async () => {
    getProductDetailMock.mockRejectedValueOnce(new Error('network error'));

    renderPage();

    expect(await screen.findByText('No se pudo cargar el producto.')).toBeInTheDocument();
  });

  it('click en "Añadir al carrito" llama a addToCart con el id y los códigos seleccionados', async () => {
    const user = userEvent.setup();
    getProductDetailMock.mockResolvedValueOnce(product);
    addToCartMock.mockResolvedValueOnce(1);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Acer')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /añadir al carrito/i }));

    expect(addToCartMock).toHaveBeenCalledWith(
      product.id,
      product.colors[0].code,
      product.storages[0].code,
    );
  });
});
