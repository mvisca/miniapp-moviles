import { Link } from 'react-router-dom'

// Placeholder de la PLP (SPEC-002/TASK-002-2). Sin lógica de datos ni
// estilos definitivos: solo el shell de routing y un link de ejemplo a
// /product/:id para poder testear la navegación hacia la PDP.
function ProductListPage() {
  return (
    <div>
      <h1>ProductListPage</h1>
      <Link to="/product/example-id">Ver producto de ejemplo</Link>
    </div>
  )
}

export default ProductListPage
