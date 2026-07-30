// Fetch wrapper compartido para toda la capa de datos (products.ts, cart.ts).
// Sin reintentos, sin timeouts, sin caché — fuera de alcance de SPEC-003
// (la caché se agrega en SPEC-008, por encima de esta capa).

const BASE_URL = ''

// Preserva el status HTTP para que quien consuma la API (p. ej.
// getProductDetail en TASK-003-2) pueda distinguir un 404 de otros fallos.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    // Cookies HttpOnly de sesión (ver CLAUDE.md §3): siempre se envían.
    credentials: 'include',
  })

  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
