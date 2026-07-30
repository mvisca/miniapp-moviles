import { Route, Routes } from 'react-router-dom'
import Header from './components/Header/Header'
import { CartProvider } from './context/CartContext'
import { ProductTitleProvider } from './context/ProductTitleContext'
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage'
import ProductListPage from './pages/ProductListPage/ProductListPage'

// Shell de routing (SPEC-002/TASK-002-2) + layout compartido (SPEC-004,
// TASK-004-2; ProductTitleProvider agregado en SPEC-006/TASK-006-0).
// Contrato de rutas — CLAUDE.md §6: '/' -> ProductListPage,
// '/product/:id' -> ProductDetailPage. CartProvider y ProductTitleProvider
// envuelven las rutas (independientes entre sí, el orden no importa) y
// Header se renderiza una sola vez por encima de <Routes>, no dentro de
// cada página. BrowserRouter sigue en src/main.tsx, fuera de alcance.
function App() {
  return (
    <CartProvider>
      <ProductTitleProvider>
        <Header />
        <Routes>
          <Route path="/" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
        </Routes>
      </ProductTitleProvider>
    </CartProvider>
  )
}

export default App
