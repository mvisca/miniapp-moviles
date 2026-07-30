// Al menos dos productos reales del catálogo traen un único storage con
// `name: " "` (whitespace) — código real, sin nombre legible (CLAUDE.md
// §6). Se normaliza solo el texto mostrado; el `code` que se envía a
// `POST /api/cart` sigue siendo el real, sin tocar.
export function normalizeStorageName(name: string): string {
  return name.trim() === '' ? 'N/A' : name;
}
