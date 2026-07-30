import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CartProvider } from '../../context/CartContext';
import Header from './Header';

// TDD baseline (TASK-004-1, ver sección "Tests required" de SPEC-004):
// - el contador refleja el count del CartContext (no se mockea el contexto,
//   se envuelve con un CartProvider real).
// - el logo/título enlaza a '/'.
// - el breadcrumb corresponde a la ruta: 'Inicio' en PLP.
// La elipsis animada del breadcrumb en PDP con marca/modelo real se prueba
// en SPEC-006 (todavía no existe el dato del producto) — fuera de alcance
// aquí, ver "Depends on" de SPEC-004.

function renderHeaderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <Routes>
          <Route path="*" element={<Header />} />
        </Routes>
      </CartProvider>
    </MemoryRouter>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('refleja el count del CartContext', () => {
    localStorage.setItem('cartCount', '3');

    renderHeaderAt('/');

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('el logo/título enlaza a la PLP (/)', () => {
    renderHeaderAt('/');

    const logoLink = screen.getByRole('link', { name: /miniapp/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('muestra el breadcrumb "Inicio" en la PLP', () => {
    renderHeaderAt('/');

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('muestra una elipsis animada como segundo segmento del breadcrumb en la PDP', () => {
    renderHeaderAt('/product/example-id');

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    // Segundo segmento: elipsis animada, un único carácter '.' repetido
    // (1 a 3 puntos) mientras no hay datos reales del producto (SPEC-006).
    const ellipsis = screen.getByTestId('breadcrumb-ellipsis');
    expect(ellipsis.textContent).toMatch(/^\.{1,3}$/);
  });
});
