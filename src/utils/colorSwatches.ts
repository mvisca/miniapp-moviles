// Diccionario de nombres de color -> hex (CLAUDE.md §6, ProductActions).
// Las entradas compuestas (p. ej. "Black/Blue") vienen tal cual las expone
// el API como clave completa, con más de un hex — así se resuelven de una
// sola pasada sin tener que partir por "/" para los casos ya conocidos.
// El lookup normaliza a lowercase (ver `getColorSwatches`), así que las
// variantes de capitalización del API ("Black" / "black") comparten entrada
// sin necesidad de duplicarla acá.
const COLOR_DICTIONARY: Record<string, string[]> = {
  'aquamarine green': ['#7FFFD4'],
  black: ['#000000'],
  'black/blue': ['#000000', '#0000FF'],
  'black/red': ['#000000', '#FF0000'],
  'black/silver': ['#000000', '#C0C0C0'],
  'black/white': ['#000000', '#FFFFFF'],
  blue: ['#0000FF'],
  'burgundy red': ['#800020'],
  'ceramic white': ['#F5F5F5'],
  'ceramic white and pearl red with 3 exchangeable battery covers': ['#F5F5F5', '#FF1493'],
  'classic white': ['#F8F8FF'],
  'dark blue': ['#00008B'],
  'dark red': ['#8B0000'],
  'essential white': ['#FAF9F6'],
  'ferrari edition': ['#FF2800'],
  'fragrant pink': ['#FFB6C1'],
  'gentle black': ['#2C2C2C'],
  'gentle grey': ['#D3D3D3'],
  gold: ['#FFD700'],
  'graphite black': ['#1C1C1C'],
  gray: ['#808080'],
  green: ['#008000'],
  'metallic red': ['#A52A2A'],
  'mystic black': ['#111111'],
  pink: ['#FFC0CB'],
  'pure white': ['#FFFFFF'],
  red: ['#FF0000'],
  'rock black': ['#333333'],
  'sandy silver': ['#C0A080'],
  silver: ['#C0C0C0'],
  'sky blue': ['#87CEEB'],
  'soft-touch black': ['#1A1A1A'],
  'sunshine yellow': ['#FFE135'],
  'titan black': ['#1E1E1E'],
  'titanium black': ['#2F2F2F'],
  'titanium gray': ['#8B8B8B'],
  'titanium grey': ['#808080'],
  various: ['#CCCCCC'],
  white: ['#FFFFFF'],
  'wine red': ['#722F37'],
  cherry: ['#DE3163'],
  lagoon: ['#4F9F9F'],
  pearl: ['#F5F5DC'],
  steel: ['#4682B4'],
}

/**
 * Resuelve un nombre de color a uno o más hex. Normaliza a lowercase para
 * cubrir duplicados de capitalización del API ("Black" / "black").
 * Si el nombre completo no matchea, intenta partirlo por "/" (colores
 * compuestos no listados literalmente) — solo si TODOS los tokens
 * resuelven; un match parcial se trata igual que ningún match (`null`),
 * para no mostrar un swatch a medias que sugiera certeza inexistente.
 * Nombres puramente descriptivos ("Various", ediciones especiales, etc.)
 * ya están cubiertos como entradas directas del diccionario.
 */
export function getColorSwatches(name: string): string[] | null {
  const normalized = name.trim().toLowerCase()
  const direct = COLOR_DICTIONARY[normalized]
  if (direct) {
    return direct
  }

  if (normalized.includes('/')) {
    const tokens = normalized.split('/').map((token) => token.trim())
    const resolved = tokens.map((token) => COLOR_DICTIONARY[token])
    if (resolved.every((swatches) => swatches !== undefined)) {
      return resolved.flatMap((swatches) => swatches as string[])
    }
  }

  return null
}
