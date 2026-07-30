import type { ChangeEvent } from 'react';
import styles from './Search.module.css';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
}

const SEARCH_LABEL = 'Buscar por marca o modelo';

/**
 * Buscador de la PLP (SPEC-005, CLAUDE.md §6): input puramente controlado,
 * sin estado interno ni debounce — el filtrado en memoria vive en
 * ProductListPage (TASK-005-2). El texto "Buscar por marca o modelo" se ve
 * como placeholder; el `<label>` sigue existiendo (asociado vía
 * `htmlFor`/`id`) pero visualmente oculto (`.srOnly`) — el placeholder no
 * reemplaza al label por accesibilidad, solo cambia lo que se ve.
 */
function Search({ value, onChange }: SearchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.search}>
      <label htmlFor="product-search" className={styles.srOnly}>
        {SEARCH_LABEL}
      </label>
      <input
        id="product-search"
        type="text"
        className={styles.input}
        placeholder={SEARCH_LABEL}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}

export default Search;
