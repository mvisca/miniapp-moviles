# Miniapp Móviles

SPA en React + TypeScript para explorar un catálogo de teléfonos móviles: listado con búsqueda, ficha de detalle con selección de color y almacenamiento, y carrito (contador simple sin detalle de productos).

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript (estricto) |
| Bundler | Vite 5 |
| Routing | React Router DOM v6 |
| Testing | Vitest + React Testing Library |
| Estilos | CSS Modules |
| Estado global | React Context (solo contador de carrito) |
| Linter | ESLint |

## Requisitos

- Node.js 18+
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

## Documentación técnica

El contexto del proyecto ([`CLAUDE.md`](./CLAUDE.md)) reúne todas las decisiones de arquitectura, el modelo de contador de carrito y caché, el contrato real del API (incluyendo inconsistencias del backend encontradas empíricamente), y las convenciones del proyecto.

> El enunciado original de la prueba no se incluye en este repositorio por tratarse de material del proceso de selección. El contexto del proyecto documenta de forma autosuficiente todos los requisitos funcionales y técnicos derivados de ese documento.

## Estado del proyecto

En desarrollo — historial de commits evolutivo por hitos.
