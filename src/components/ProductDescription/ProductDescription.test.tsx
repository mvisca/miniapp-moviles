import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProductDetail } from '../../types/domain';
import ProductDescription from './ProductDescription';

// TDD baseline (TASK-006-2, ver "Tests required" de SPEC-006):
// - renderiza los specs del producto (marca, modelo, precio, CPU, RAM, SO,
//   resolución de pantalla, batería, cámaras, dimensiones, peso).
// - price: null -> "No disponible".
// - la "resolución de pantalla" mostrada viene de `screenResolution` (el
//   mapper de la capa de datos ya resolvió el swap displaySize/displayResolution,
//   este componente solo debe leer el campo correcto).
// - cámara trasera y frontal se renderizan en líneas separadas, nunca
//   concatenadas.

const baseProduct: ProductDetail = {
  id: 'abc123',
  brand: 'Acer',
  model: 'Liquid E700',
  price: 299,
  imgUrl: 'https://example.com/abc123.png',
  cpu: 'ST Ericsson PNX6715, 416 MHz',
  ram: '2 GB RAM or 4 GB, 1 GB RAM',
  os: 'Android 4.4.4 (KitKat), upgradable to 5.1 (Lollipop)',
  screenResolution: '480x854-VALOR-DISTINTIVO-PIXELS',
  battery: 'Li-Ion 1500 mAh',
  rearCamera: '8 MP, autofocus',
  frontCamera: '2 MP',
  dimensions: '110 x 60 x 12 mm',
  weight: '120 g',
  colors: [{ code: 1, name: 'Negro' }],
  storages: [{ code: 1, name: '16 GB' }],
};

describe('ProductDescription', () => {
  it('renderiza marca, modelo y precio', () => {
    render(<ProductDescription product={baseProduct} />);

    expect(screen.getByText(/Acer/)).toBeInTheDocument();
    expect(screen.getByText(/Liquid E700/)).toBeInTheDocument();
    expect(screen.getByText(/299/)).toBeInTheDocument();
  });

  it('price: null -> muestra "No disponible"', () => {
    render(<ProductDescription product={{ ...baseProduct, price: null }} />);

    expect(screen.getByText('No disponible')).toBeInTheDocument();
  });

  it('renderiza CPU, RAM y sistema operativo', () => {
    render(<ProductDescription product={baseProduct} />);

    expect(screen.getByText(baseProduct.cpu)).toBeInTheDocument();
    expect(screen.getByText(baseProduct.ram)).toBeInTheDocument();
    expect(screen.getByText(baseProduct.os)).toBeInTheDocument();
  });

  it('la resolución de pantalla mostrada viene de screenResolution (no de displayResolution)', () => {
    render(<ProductDescription product={baseProduct} />);

    expect(
      screen.getByText(baseProduct.screenResolution),
    ).toBeInTheDocument();
  });

  it('renderiza batería, dimensiones y peso', () => {
    render(<ProductDescription product={baseProduct} />);

    expect(screen.getByText(baseProduct.battery)).toBeInTheDocument();
    expect(screen.getByText(baseProduct.dimensions)).toBeInTheDocument();
    expect(screen.getByText(baseProduct.weight)).toBeInTheDocument();
  });

  it('renderiza cámara trasera y frontal en líneas separadas', () => {
    render(<ProductDescription product={baseProduct} />);

    const rear = screen.getByText(baseProduct.rearCamera);
    const front = screen.getByText(baseProduct.frontCamera);

    expect(rear).toBeInTheDocument();
    expect(front).toBeInTheDocument();
    expect(rear).not.toBe(front);
  });

  it('unifica un spec vacío a "-"', () => {
    render(<ProductDescription product={{ ...baseProduct, battery: '' }} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
