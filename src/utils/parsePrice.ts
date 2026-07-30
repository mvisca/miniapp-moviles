/**
 * Parsea el campo `price` crudo del API (siempre `string`, a veces `''` o
 * no numérico) a un número de dominio, o `null` si no es un precio válido.
 *
 * No usa `parseFloat` de forma laxa: un string no numérico o parcialmente
 * numérico (p. ej. "299abc") debe dar `null`, no un número truncado.
 */
export function parsePrice(raw: string): number | null {
  if (raw.trim() === '') {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
}
