import styles from './ProductImage.module.css';

interface ProductImageProps {
  imgUrl: string;
  brand: string;
  model: string;
}

/**
 * Presentacional puro (SPEC-006, CLAUDE.md §6): uno de los tres bloques de
 * la PDP. Sin estado ni fetch propio — recibe todo por props.
 */
function ProductImage({ imgUrl, brand, model }: ProductImageProps) {
  return (
    <img
      className={styles.image}
      src={imgUrl}
      alt={`${brand} ${model}`}
    />
  );
}

export default ProductImage;
