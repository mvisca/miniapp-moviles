# Contexto del proyecto — Miniapp Móviles (Prueba Frontend Hiberus/ITX)

Este documento es la fuente única de verdad del proyecto: decisiones de arquitectura, contrato real del API (verificado contra el backend), convenciones y justificaciones. El enunciado original de la prueba no forma parte de este repositorio por confidencialidad del proceso.

## 1. Qué es este proyecto

SPA de comercio de dispositivos móviles con dos vistas — listado (PLP) y detalle de producto (PDP) —, carrito con contador simple respaldado por el servidor, y caché cliente de las respuestas del API con expiración.

Backend real: `https://itx-frontend-test.onrender.com` (API REST ya provista, no se desarrolla backend).

## 2. Stack tecnológico

| Decisión | Elección |
|---|---|
| Framework | React 18 |
| Lenguaje | TypeScript estricto |
| Bundler | Vite 5 |
| Routing | React Router DOM v6 (Browser Router, sin `#`) |
| Testing | Vitest + React Testing Library |
| Linter | ESLint 9 (flat config), incluido con el scaffold de Vite + `@vitejs/plugin-react` |
| Gestor de paquetes | pnpm (se documenta alternativa con npm en README) |
| Estado global | React Context (solo contador de carrito) |
| Estilos | CSS Modules |
| Colores dinámicos | Mapping a clases CSS completas (`colorMap[code]`), nunca cadenas construidas dinámicamente |
| Validación runtime del API | Funciones defensivas puntuales (`parsePrice`, `toList`) sobre las inconsistencias reales encontradas — ver §4.5 |
| Versionado de dependencias | Versiones exactas en `package.json` (sin `^`/`~`), fijadas también por el lockfile de pnpm. Garantizado por `save-exact=true` en `.npmrc` (raíz del repo, versionado) — válido tanto con `pnpm add` como con `npm install`. Evita que una actualización menor/patch de una dependencia rompa el build sin que medie una decisión explícita de subir versión |

No es SPA con SSR ni MPA: una sola aplicación cliente servida estática tras build.

## 3. Modelo de carrito y sesión

- **Modelo**: solo contador numérico. El carrito nunca almacena la lista de artículos en cliente.
- **Fuente de verdad**: el servidor. El `count` devuelto por `POST /api/cart` es siempre el valor autoritativo.
- **Persistencia cliente**: se guarda únicamente el último `count` conocido en `localStorage` bajo la clave `cartCount`. Es también la única fuente del contador al cargar la app: `GET /api/cart` no existe en el API (verificado — devuelve `404 Cannot GET /api/cart`), así que no hay forma de consultar el contador al servidor sin agregar un producto. El valor de `localStorage` se pinta de entrada y se actualiza con el `count` real recién en el próximo `POST /api/cart`.
- **Autenticación**: cookies `HttpOnly` firmadas por el servidor; el navegador las envía automáticamente con `fetch(..., { credentials: 'include' })`. No se gestiona la sesión desde el cliente.

### Detección de pérdida de sesión (heurística)

Verificado empíricamente: la cookie de sesión no tiene `Max-Age`/`Expires` (se confirmó inspeccionando la respuesta del servidor) — es una cookie de sesión pura, cuya validez depende enteramente del estado en memoria del servidor. Esto es consistente con el comportamiento observado: la sesión se pierde por reinicio/spin-down del servidor (típico del free tier de Render tras inactividad), no por expiración del lado del cliente. Por eso `cartCount` (ver más abajo) se persiste sin TTL propio: no hay nada que expirar del lado cliente, la pérdida siempre la origina el servidor.

- **Función**: `isValidIncrement(prevCount: number, newCount: number): boolean` → `true` cuando `newCount > prevCount` (continuación normal de la sesión); `false` en cualquier otro caso. Cuando devuelve `false`, se interpreta como pérdida de la sesión anterior y se muestra un aviso al usuario ("se perdió el carrito anterior, se inició uno nuevo"). El nuevo `count` se persiste siempre, sea cual sea el resultado.
- **Fuera de alcance**: por qué o cuándo exactamente el backend pierde la sesión — es infraestructura del servidor, no controlable desde el frontend.
- **Límite conocido (aceptado)**: si el carrito está en `0` cuando se pierde la sesión, un nuevo `count: 1` es indistinguible de un incremento normal — `isValidIncrement` da `true` en ambos casos. Resolverlo requeriría que el backend expusiera alguna señal de continuidad de sesión (p. ej. un id de sesión persistente separado del contador), algo fuera del control del frontend. Se acepta esta limitación por esa razón, no por conveniencia.

## 4. Contrato real del API (verificado empíricamente)

El backend no está completamente documentado; lo siguiente se confirmó con pruebas directas (`curl`) contra el entorno en producción.

### 4.1 `POST /api/cart` — validación real

- Valida **presencia estructural** de `id`, `colorCode`, `storageCode`: si falta alguno, devuelve `400` con body `{"message":"Invalid parameters","code":0}` (verificado con `curl` contra el endpoint real).
- **No valida semánticamente** los valores: acepta `id`, `colorCode` o `storageCode` inexistentes, responde `200 OK` e incrementa el contador igualmente.
- Los códigos inválidos **no afectan la sesión** (no la resetean, no dan error, no cambian el comportamiento del contador).
- **Consecuencia de diseño**: la validez de las opciones seleccionadas es responsabilidad exclusiva del frontend. Los selectores de color y almacenamiento en el PDP se populan siempre desde `options.colors[]` / `options.storages[]` de la respuesta del propio producto — nunca se permite un valor fuera de esa lista, evitando así que el usuario pueda enviar un código inválido desde la UI.
- No se puede usar "el contador no incrementó" como señal de opción inválida: el API siempre incrementa, sin importar la validez de los códigos.

### 4.2 Precio (`price`)

- Viene como `string`. En una muestra de 100 productos del catálogo real, ~6% tenían `price: ""`.
- `parsePrice(raw: string): number | null` — devuelve `null` ante `''` o cualquier string no numérico.
- Si `price` es `null`: el producto se marca como **"No disponible"** tanto en PLP como en PDP (precio oculto, botón de añadir al carrito deshabilitado). No se ocultan productos sin precio, se muestran como no disponibles.
- No se implementa ordenamiento por precio (no lo pide el enunciado).

### 4.3 Detalle de producto — inconsistencias de nombres y tipos

Sobre los campos que **sí** requiere el enunciado:

- **Typos reales del API** (se preservan tal cual en el tipo raw, no se "corrigen" en la fuente): `dimentions` (no `dimensions`), `secondaryCmera` (no `secondaryCamera`).
- **Campos con nombres invertidos**: `displayResolution` en realidad contiene el tamaño físico en pulgadas; `displaySize` en realidad contiene la resolución en píxeles. Verificado en múltiples productos, consistente. El atributo "Resolución de pantalla" del enunciado se mapea desde `displaySize`, no desde `displayResolution`.
- **Campos polimórficos** (`string` en algunos productos, `string[]` en otros, sin patrón aparente): `cpu`, `ram`, `os`, `primaryCamera` y `secondaryCmera` — los cinco requeridos por el enunciado (CPU, RAM, Sistema Operativo, Cámaras). Verificado en muestra real: p. ej. `ram: ["2 GB RAM or 4 GB", "1 GB RAM"]` (Acer Liquid E700), `cpu: ["ST Ericsson PNX6715", "416 MHz"]` (Acer beTouch E120), `os: ["Android 4.4.4 (KitKat)", "upgradable to 5.1 (Lollipop)"]` (Acer Liquid Jade S). Es data scrapeada (aparenta ser de GSMArena) donde el campo original venía como fragmentos separados por comas y quedó partido de forma inconsistente entre elementos del array — no hay estructura semántica que reconstruir. Los cinco campos se normalizan igual, sin lógica especial por campo: `toList(v: string | string[]): string[]` seguido de `.join(', ')`.
- `options.colors[]` / `options.storages[]` llegan consistentes como `{ code: number; name: string }[]` en todos los productos verificados.

Sobre campos que el API expone pero **no** pide el enunciado: se observó que `wlan`, `bluetooth`, `sensors` también son polimórficos (`string` o `string[]`) y que `nfc` aparece siempre como `''` en la muestra verificada. Se documenta la observación como evidencia de la inconsistencia general del backend; el alcance de esta prueba se limita a los campos que el enunciado pide, así que el tipo raw y el mapper cubren únicamente esos.

### 4.4 Tipos

```ts
// Fiel al API, incluye los typos reales. Solo declara los campos que
// efectivamente se leen (el response trae más campos sin usar — ver 4.3).
interface ProductDetailRaw {
  id: string;
  brand: string;
  model: string;
  price: string;
  cpu: string | string[];
  ram: string | string[];
  os: string | string[];
  displaySize: string;       // realmente: resolución en píxeles
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

// Tipo de dominio limpio, el único que consume la UI
interface ProductDetail {
  id: string;
  brand: string;
  model: string;
  price: number | null;
  cpu: string;
  ram: string;
  os: string;
  screenResolution: string;
  battery: string;
  rearCamera: string;   // primaryCamera normalizado y unido
  frontCamera: string;  // secondaryCamera normalizado y unido
  dimensions: string;
  weight: string;
  colors: { code: number; name: string }[];
  storages: { code: number; name: string }[];
}
```

`mapProductDetail(raw): ProductDetail` vive junto al fetch, en `api/products.ts`: corrige el swap de resolución/tamaño, normaliza los campos polimórficos (`toList` + `.join(', ')` para `cpu`, `ram`, `os`, `primaryCamera`, `secondaryCmera`) y aplica `parsePrice`.

**Listado** (`GET /api/product`) — shape confirmado por request directa:

```ts
interface ProductListItemRaw {
  id: string;
  brand: string;
  model: string;
  price: string; // mismo problema: puede venir ''
  imgUrl: string;
}

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number | null;
  imgUrl: string;
}
```

`mapProductListItem(raw): Product` aplica `parsePrice`, mismo patrón que el mapper de detalle. Se cachea el array ya mapeado.

### 4.5 Alcance de la validación runtime del API

Las únicas inconsistencias reales encontradas (precio vacío, campos polimórficos) están cubiertas por dos funciones puntuales, `parsePrice` y `toList`, aplicadas en los mappers junto al fetch. El `interface` de TypeScript documenta el contrato en compile-time; la garantía runtime se limita a esos dos casos verificados, por decisión de alcance explícita.

## 5. Caché cliente

- **Método**: `localStorage`, TTL de 1 hora, independiente del estado del carrito.
- **Listado de productos** (`GET /api/product`): se cachea como un único blob `{ data: Product[], timestamp }` bajo una sola clave. El endpoint ya devuelve el array completo en una sola llamada; se cachea ya mapeado (`Product[]`, no el raw).
- **Detalle de producto** (`GET /api/product/:id`): una clave independiente por producto, `product_detail_<id>` → `{ data: ProductDetail, timestamp }`. Motivo: cada detalle se pide y expira de forma independiente; una clave por id evita reescribir/reparsear todo un diccionario en cada visita a un PDP, y aísla la corrupción — un JSON inválido en una entrada no invalida el resto del caché. El volumen (máximo ~100 entradas, catálogo completo) es intrascendente para la cuota de `localStorage`.
- **Carrito**: `cartCount`, un entero, clave separada — sin relación con el TTL de 1 hora del catálogo.

## 6. Contrato de vistas y componentes

### Rutas

| Ruta | Vista |
|---|---|
| `/` | `ProductListPage` (PLP) |
| `/product/:id` | `ProductDetailPage` (PDP) |

**PLP (`ProductListPage`)**: listado con buscador (filtra por marca + modelo en tiempo real) y grilla de `ProductItem` (imagen, marca, modelo, precio o "No disponible"). Si el filtro no matchea ningún producto, la grilla se reemplaza por un estado vacío con el mensaje "No se encontraron resultados para «‹término›»" — no se oculta el buscador ni se resetea el término.

Mientras `GET /api/product` está en curso, se muestra un mensaje simple de "Cargando productos...". Si el fetch falla (error de red o respuesta no-2xx — relevante por el cold-start del free tier de Render, que puede demorar la primera respuesta), se muestra un mensaje de error con un botón para reintentar la carga.

**PDP (`ProductDetailPage`)**, dividido en tres bloques:
- `ProductImage`: imagen del producto.
- `ProductDescription`: specs — marca, modelo, precio, CPU, RAM, sistema operativo, resolución de pantalla, batería, cámaras (trasera y frontal como líneas separadas), dimensiones, peso.
- `ProductActions`: selectores de almacenamiento y color (poblados exclusivamente desde `options`, ver §4.1) + botón de añadir al carrito (deshabilitado si `price` es `null`).

Si `GET /api/product/:id` devuelve `404` (id inexistente), se muestra el mensaje "Producto no encontrado" con un enlace de vuelta a la PLP — no hay redirect automático, la decisión de volver es del usuario.

**`Header`**, presente en todas las vistas, requerido por el enunciado:
- Título/logo enlazado a la PLP (vuelve al listado desde cualquier vista).
- Breadcrumbs de la ruta actual (p. ej. `Inicio` en PLP; `Inicio / ‹marca› ‹modelo›` en PDP). Mientras el detalle del producto está en curso de carga, el segundo segmento se muestra como una elipsis animada (`.` → `..` → `...`, en loop), reemplazada por `‹marca› ‹modelo›` en cuanto llega la respuesta.
- Contador de carrito, siempre visible, reflejando el `count` vigente.

## 7. Estructura de carpetas

```
src/
├── api/
│   ├── client.ts        → fetch wrapper base (credentials: 'include')
│   ├── products.ts      → getProducts(), getProductDetail(id) + mappers colocados
│   └── cart.ts          → addToCart()
├── assets/
│   └── logo.svg          → import nativo de Vite (URL); sin config extra
├── components/
│   └── <Nombre>/
│       ├── <Nombre>.tsx
│       ├── <Nombre>.module.css
│       └── <Nombre>.test.tsx
├── pages/
│   ├── ProductListPage/
│   │   ├── ProductListPage.tsx
│   │   ├── ProductListPage.module.css
│   │   └── ProductListPage.test.tsx
│   └── ProductDetailPage/
│       ├── ProductDetailPage.tsx
│       ├── ProductDetailPage.module.css
│       └── ProductDetailPage.test.tsx
├── context/
│   └── CartContext.tsx
├── utils/
│   ├── cache.ts          → getCached/setCached genérico con TTL
│   ├── cache.test.ts
│   ├── parsePrice.ts
│   ├── parsePrice.test.ts
│   ├── toList.ts
│   ├── toList.test.ts
│   ├── isValidIncrement.ts
│   └── isValidIncrement.test.ts
└── types/
    ├── api.ts            → tipos raw (fieles al API, con sus typos)
    └── domain.ts          → tipos limpios que consume la UI
```

Carpeta `assets/` solo para estáticos referenciados desde código (SVG de logo, íconos). Vite soporta `import logo from './assets/logo.svg'` de forma nativa, devolviendo la URL final procesada — suficiente para este alcance.

## 8. Scripts y verificación

El enunciado exige cuatro scripts para gestionar la aplicación: START (modo desarrollo), BUILD (compilación a producción), TEST (lanzamiento de tests) y LINT (comprobación de código). Se usan esos nombres literales en `package.json`.

| Script | Comando | Requerido | Propósito |
|---|---|---|---|
| `start` | `vite` | Sí (START) | Servidor de desarrollo |
| `build` | `tsc -b && vite build` | Sí (BUILD) | Type-check + build (falla si hay errores de tipos) |
| `test` | `vitest run` | Sí (TEST) | Suite completa, una pasada (CI-friendly) |
| `lint` | `eslint .` | Sí (LINT) | Lint estático |
| `preview` | `vite preview` | Añadido por decisión | Sirve el build localmente, útil para verificar el resultado de `build` antes de desplegar |
| `test:watch` | `vitest` | Añadido por decisión | Suite en modo watch, para desarrollo día a día |

Sin `.eslintignore`: el scaffold de Vite 5 usa ESLint 9 con flat config (`eslint.config.js`), donde las exclusiones van en el array `ignores` del propio config (típicamente `dist/`), no en un archivo aparte — el formato `.eslintignore` es legacy (ESLint ≤8) y ESLint 9 ni siquiera lo lee por defecto. No hace falta excluir explícitamente `CLAUDE.md`, `README.md` u otros documentos: el propio config ya scopea el lint por extensión (`files: ['**/*.{ts,tsx}']`), así que `eslint .` nunca llega a evaluar Markdown — no hay nada que agregar al array `ignores` para eso.

### Plan de tests

El enunciado exige el script TEST (lanzamiento de tests), no casos de test concretos: qué se testea es enteramente decisión del desarrollador. La siguiente es esa elección:

**Estrategia de mock del API**: `vi.mock('../../api/products')` / `vi.mock('../../api/cart')` a nivel de módulo. Los mappers (`mapProductDetail`, `mapProductListItem`) ya aíslan el fetch crudo del resto de la app, así que alcanza con controlar qué devuelven las funciones de `api/*` para testear componentes e integración de vistas.

- `ProductItem`: renderiza marca/modelo/precio; `price: null` → "No disponible" + botón deshabilitado.
- Buscador: filtra por marca + modelo en tiempo real; sin matches → estado vacío "No se encontraron resultados".
- `Header`: refleja el contador de carrito; título/logo enlaza a la PLP; breadcrumbs corresponden a la ruta actual.
- `ProductActions` (PDP): selectores de color/almacenamiento poblados solo desde `options`; botón de añadir deshabilitado cuando `price` es `null`; click incrementa el contador del `Header`.
- Integración PLP → PDP: PLP carga productos (fetch mockeado) y navega al detalle al hacer click en un `ProductItem`.
- `parsePrice`: `''` → `null`; `"299"` → `299`; string no numérico → `null`.
- `toList`: string → `[string]`; array → tal cual.
- `mapProductDetail`: regresión directa del swap `displaySize` ↔ `displayResolution`.
- `cache.ts`: entrada fresca se devuelve; entrada expirada devuelve `null` y se limpia.
- `isValidIncrement`: `newCount > prevCount` → `true`; `newCount <= prevCount` → `false`.

## 9. Convenciones de repo y commits

- Repositorio público (GitHub), historial visible desde el primer commit — sin squash final. El historial evolutivo es parte de lo que se evalúa.
- Commits por hito, formato `tipo: descripción`:

| Tipo | Uso |
|---|---|
| `chore` | Setup, configuración, dependencias |
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de bug |
| `test` | Tests agregados/ajustados |
| `docs` | Documentación |

- Secuencia de hitos: setup inicial → cliente API + listado → PLP → PDP → carrito → caché → tests → README final.

### `.gitignore`

`node_modules/`, `dist/`, `.env`, `.env.local`, `.feinai/`, `docs/enunciado.pdf`, `.DS_Store`, `*.log`.

El enunciado original (PDF) se mantiene solo en el filesystem local como referencia de trabajo — nunca se sube al repositorio público, por confidencialidad del proceso de selección. Este documento de contexto reemplaza esa necesidad para cualquier evaluador externo.

## 10. Herramienta interna: feinai

Este proyecto usa `feinai` como herramienta interna de trabajo (gestión de specs y decisiones durante el desarrollo, en `.feinai/`). No forma parte del entregable — está excluida vía `.gitignore`. Todas las decisiones que contenía están volcadas en este documento, que es la fuente de verdad para cualquiera que evalúe o continúe este repo sin acceso a esa herramienta.
