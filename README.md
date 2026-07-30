# Miniapp Móviles

SPA en React + TypeScript para explorar un catálogo de teléfonos móviles: listado con búsqueda, ficha de detalle con selección de color y almacenamiento, y carrito (contador simple sin detalle de productos).

## Vistas

- **Listado** (`/`) — catálogo completo del API, búsqueda en tiempo real por marca/modelo, grilla responsive (2/3/4 columnas según viewport).
- **Detalle** (`/product/:id`) — imagen, ficha técnica (marca, modelo, precio, CPU, RAM, SO, resolución de pantalla, batería, cámaras, dimensiones, peso) y acciones (selección de color/almacenamiento + añadir al carrito).

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript (estricto) |
| Bundler | Vite 8 |
| Routing | React Router DOM v6 |
| Testing | Vitest + React Testing Library — 132 tests |
| Estilos | CSS Modules |
| Estado global | React Context (solo contador de carrito) |
| Linter | ESLint |

## Requisitos

- Node.js 20.19+ o 22.12+ (mínimo exigido por Vite 8)
- pnpm o npm

## Instalación y uso

```bash
pnpm install       # o: npm install

pnpm start         # servidor de desarrollo
pnpm build         # type-check + build de producción
pnpm preview       # sirve el build localmente
pnpm test          # suite de tests (una pasada)
pnpm test:watch    # suite de tests en modo watch
pnpm lint          # lint estático
```

## Backend

Consume el API real provisto para la prueba (`https://itx-frontend-test.onrender.com`), sin mocks ni backend propio. Corre en el free tier de Render: si lleva un rato inactivo, la primera petición puede tardar varios segundos en "despertar" el servidor. La app lo maneja con reintentos automáticos en backoff lineal y un aviso visible de countdown — no hace falta refrescar a mano.

## Notas técnicas destacadas

El catálogo real tiene inconsistencias que se manejaron explícitamente en vez de asumir un API "feliz":

- **Precio ausente**: ~6% de los productos traen `price: ""` — se detecta y se muestran como "No disponible" con el botón de compra deshabilitado, en vez de romper o mostrar `NaN`.
- **Campos polimórficos**: CPU, RAM, SO y cámaras a veces llegan como `string`, a veces como `string[]` fragmentado (ej. `["ST Ericsson PNX6715", "416 MHz"]`) — se normalizan de forma consistente.
- **404 indistinguible de 500**: pedir un producto con id inválido no devuelve 404, devuelve un 500 genérico idéntico al de un error real de servidor. Se resuelve cruzando contra el listado para confirmar la ausencia del id antes de mostrar "producto no encontrado", sin enmascarar una caída real del backend.
- **Pérdida de sesión del carrito**: la sesión vive en memoria del servidor (free tier de Render) y puede reiniciarse. Se detecta cuando el contador no continúa la secuencia esperada y se avisa al usuario en vez de mostrar un número inconsistente en silencio.
- **Mapeo de color a UI**: los nombres de color del API (`"Ceramic White and Pearl Red..."`, compuestos con `/`, etc.) se resuelven a swatches cromáticos reales; si un nombre no se puede resolver con certeza se muestra un indicador explícito de "desconocido" en vez de un color inventado.
- **Caché con expiración**: listado y detalle de producto se cachean en cliente (`localStorage`) con TTL de 1 hora, revalidando contra el API al expirar — evita peticiones repetidas sin servir datos obsoletos indefinidamente.

## Documentación técnica

El contexto del proyecto ([`CLAUDE.md`](./CLAUDE.md)) reúne todas las decisiones de arquitectura, el modelo de contador de carrito y caché, el contrato real del API (incluyendo inconsistencias del backend encontradas empíricamente), y las convenciones del proyecto.

> El enunciado original de la prueba no se incluye en este repositorio por tratarse de material del proceso de selección. El contexto del proyecto documenta de forma autosuficiente todos los requisitos funcionales y técnicos derivados de ese documento.

## Estado del proyecto

Completo — historial de commits evolutivo por hitos.
