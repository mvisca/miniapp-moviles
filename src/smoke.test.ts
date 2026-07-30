import { describe, expect, it } from 'vitest'

// Smoke test trivial: verifica que el pipeline de Vitest (config, jsdom,
// globals) funciona antes de que existan features reales que testear.
describe('scaffold smoke test', () => {
  it('runs in a jsdom environment with globals available', () => {
    expect(typeof document).toBe('object')
    expect(1 + 1).toBe(2)
  })
})
