import { Route, Routes } from 'react-router-dom'
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage'
import ProductListPage from './pages/ProductListPage/ProductListPage'

// Shell de routing (SPEC-002/TASK-002-2). Contrato de rutas — CLAUDE.md §6:
// '/' -> ProductListPage, '/product/:id' -> ProductDetailPage. Header,
// CartContext y features reales llegan en specs posteriores (SPEC-004+).
function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductListPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
    </Routes>
  )
}

export default App
