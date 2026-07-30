import { useParams } from 'react-router-dom'

// Placeholder de la PDP (SPEC-002/TASK-002-2). Sin lógica de datos ni
// estilos definitivos: solo el shell de routing.
function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <h1>ProductDetailPage</h1>
      <p>id: {id}</p>
    </div>
  )
}

export default ProductDetailPage
