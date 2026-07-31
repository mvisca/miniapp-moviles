import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RetryCountdown from './RetryCountdown'

// TDD baseline (TASK-011-1, ver "Tests required" de SPEC-011, sección
// RetryCountdown): componente presentacional puro, sin estado ni fetch.
// Debe mostrar el emoji ⏰, el secondsRemaining y el attempt/totalAttempts
// en el texto.
describe('RetryCountdown', () => {
  it('muestra el emoji, el countdown y el intento actual en el texto', () => {
    render(<RetryCountdown attempt={2} totalAttempts={5} secondsRemaining={4} />)

    expect(screen.getByText('⏰')).toBeInTheDocument()
    expect(
      screen.getByText('El servidor no está despierto todavía. Reintentando en 4s… (intento 2/5)'),
    ).toBeInTheDocument()
  })

  it('expone role="status" para que lectores de pantalla anuncien el countdown sin ser intrusivo', () => {
    render(<RetryCountdown attempt={1} totalAttempts={5} secondsRemaining={2} />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('actualiza el texto cuando cambian las props', () => {
    const { rerender } = render(
      <RetryCountdown attempt={1} totalAttempts={5} secondsRemaining={2} />,
    )

    expect(
      screen.getByText('El servidor no está despierto todavía. Reintentando en 2s… (intento 1/5)'),
    ).toBeInTheDocument()

    rerender(<RetryCountdown attempt={3} totalAttempts={5} secondsRemaining={6} />)

    expect(
      screen.getByText('El servidor no está despierto todavía. Reintentando en 6s… (intento 3/5)'),
    ).toBeInTheDocument()
  })
})
