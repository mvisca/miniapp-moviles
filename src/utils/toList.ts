/**
 * Normaliza un campo polimórfico del API (`string | string[]`) a un array.
 * String → array de un elemento; array → se devuelve tal cual (identidad).
 */
export function toList(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}
