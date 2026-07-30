import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductImage from './ProductImage';

// TDD baseline (TASK-006-1, ver SPEC-006): ProductImage es un componente
// presentacional puro sin requisitos de test explícitos en la spec más allá
// de renderizar correctamente — smoke test: imagen con src y alt correctos.
describe('ProductImage', () => {
  it('renderiza la imagen con src y alt correctos', () => {
    render(
      <ProductImage
        imgUrl="https://example.com/phone.jpg"
        brand="Acer"
        model="Liquid E700"
      />,
    );

    const img = screen.getByRole('img', { name: 'Acer Liquid E700' });
    expect(img).toHaveAttribute('src', 'https://example.com/phone.jpg');
  });
});
