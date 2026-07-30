import type { ChangeEvent } from 'react';
import styles from './Search.module.css';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Buscador de la PLP (SPEC-005, CLAUDE.md §6): input puramente controlado,
 * sin estado interno ni debounce — el filtrado en memoria vive en
 * ProductListPage (TASK-005-2). El label es visible y está asociado al
 * input vía `htmlFor`/`id` (a11y, CLAUDE.md §6).
 */
function Search({ value, onChange }: SearchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.search}>
      <label htmlFor="product-search" className={styles.label}>
        Buscar por marca o modelo
      </label>
      <input
        id="product-search"
        type="text"
        className={styles.input}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}

export default Search;
