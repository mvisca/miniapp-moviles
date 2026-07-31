// Los valores de specs del detalle de producto vienen inconsistentes
// cuando faltan: a veces el API trae un string vacío, a veces ya trae
// "-" (CLAUDE.md §6, ProductDescription) — se unifica a "-" en ambos
// casos para que la ficha de specs no mezcle vacíos con guiones.
export function formatSpecValue(value: string): string {
  const trimmed = value.trim()
  return trimmed === '' ? '-' : trimmed
}
