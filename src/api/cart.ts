// Carrito: solo la llamada al API. El contador (persistencia, heurística de
// sesión perdida vía isValidIncrement) vive en CartContext — SPEC-007.
// No se valida semánticamente colorCode/storageCode aquí: por contrato del
// API (CLAUDE.md §4.1) esa responsabilidad es de la UI al poblar los
// selectores exclusivamente desde options.colors[] / options.storages[].

import { request } from './client'

interface CartResponse {
  count: number
}

export async function addToCart(
  id: string,
  colorCode: number,
  storageCode: number,
): Promise<number> {
  const response = await request<CartResponse>('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, colorCode, storageCode }),
  })

  return response.count
}
