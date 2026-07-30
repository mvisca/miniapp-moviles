import { Route, Routes } from 'react-router-dom'
import Header from './components/Header/Header'
import SessionLostNotice from './components/SessionLostNotice/SessionLostNotice'
import { CartProvider } from './context/CartContext'
import { ProductTitleProvider } from './context/ProductTitleContext'
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage'
import ProductListPage from './pages/ProductListPage/ProductListPage'
import styles from './App.module.css'

// Shell de routing (SPEC-002/TASK-002-2) + layout compartido (SPEC-004,
// TASK-004-2; ProductTitleProvider agregado en SPEC-006/TASK-006-0).
// Contrato de rutas — CLAUDE.md §6: '/' -> ProductListPage,
// '/product/:id' -> ProductDetailPage. CartProvider y ProductTitleProvider
// envuelven las rutas (independientes entre sí, el orden no importa) y
// Header se renderiza una sola vez por encima de <Routes>, no dentro de
// cada página. BrowserRouter sigue en src/main.tsx, fuera de alcance.
//
// `<main>` es el único contenedor con scroll de la app (App.module.css):
// #root tiene altura fija (100svh, overflow:hidden), Header queda afuera
// del área con scroll, y `<main>` absorbe el resto del alto (flex:1) con
// su propio overflow-y. Así el navbar nunca se ve afectado por la
// aparición/desaparición de la scrollbar del contenido.
//
// SessionLostNotice se renderiza como hermano de <main>, no como hijo:
// así queda fuera del contenedor con scroll y su `position: fixed`
// (SessionLostNotice.module.css) lo mantiene anclado al viewport,
// debajo del navbar, sin importar cuánto se scrollee el contenido.
function App() {
  return (
    <CartProvider>
      <ProductTitleProvider>
        <Header />
        <SessionLostNotice />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<ProductListPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
          </Routes>
        </main>
      </ProductTitleProvider>
    </CartProvider>
  )
}

export default App
