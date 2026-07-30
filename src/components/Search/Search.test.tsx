import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Search from './Search';

// TDD baseline (TASK-005-1, ver "Tests required" de SPEC-005): solo se
// cubren aquí los casos aislables del propio componente controlado —
// render del valor recibido por props y disparo de onChange. El filtrado
// en tiempo real y el estado vacío se prueban a nivel de ProductListPage
// (TASK-005-2), donde vive la lógica de filtrado.

describe('Search', () => {
  it('expone un label accesible asociado al input', () => {
    render(<Search value="" onChange={() => {}} />);

    expect(
      screen.getByLabelText(/buscar por marca o modelo/i),
    ).toBeInTheDocument();
  });

  it('renderiza el input controlado con el value recibido por props', () => {
    render(<Search value="iphone" onChange={() => {}} />);

    const input = screen.getByLabelText(/buscar por marca o modelo/i);
    expect(input).toHaveValue('iphone');
  });

  it('llama a onChange con el nuevo valor al escribir', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Search value="" onChange={handleChange} />);

    const input = screen.getByLabelText(/buscar por marca o modelo/i);
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });
});
