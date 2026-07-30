// Tipos "raw", fieles al contrato real del API (ver CLAUDE.md §4).
// Se preservan a propósito los typos reales del backend (`dimentions`,
// `secondaryCmera`) y el swap `displaySize` / `displayResolution`.
// Solo se declaran los campos que efectivamente se leen — el response
// real trae más campos sin usar (ver CLAUDE.md §4.3).

export interface ProductListItemRaw {
  id: string;
  brand: string;
  model: string;
  price: string;
  imgUrl: string;
}

export interface ProductDetailRaw {
  id: string;
  brand: string;
  model: string;
  price: string;
  cpu: string | string[];
  ram: string | string[];
  os: string | string[];
  displaySize: string; // realmente: resolución en píxeles
  displayResolution: string; // realmente: tamaño físico en pulgadas
  battery: string;
  primaryCamera: string | string[];
  secondaryCmera: string | string[];
  dimentions: string;
  weight: string;
  options: {
    colors: { code: number; name: string }[];
    storages: { code: number; name: string }[];
  };
}
