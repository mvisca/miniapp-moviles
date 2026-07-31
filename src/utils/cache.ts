import type { Product, ProductDetail } from '../types/domain';

export const PRODUCT_CACHE_TTL_MS = 3_600_000; // 1 hora

type CacheKey = 'products' | 'cartCount' | `product_detail_${string}`;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCached<T>(key: CacheKey, ttlMs?: number): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return null;
  }

  let parsed: CacheEntry<T>;
  try {
    parsed = JSON.parse(raw) as CacheEntry<T>;
  } catch {
    localStorage.removeItem(key);
    return null;
  }

  if (ttlMs !== undefined && Date.now() - parsed.timestamp > ttlMs) {
    localStorage.removeItem(key);
    return null;
  }

  return parsed.data;
}

function setCached<T>(key: CacheKey, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(entry));
}

export function getProductsCache(): Product[] | null {
  return getCached<Product[]>('products', PRODUCT_CACHE_TTL_MS);
}

export function setProductsCache(data: Product[]): void {
  setCached('products', data);
}

export function getProductDetailCache(id: string): ProductDetail | null {
  return getCached<ProductDetail>(`product_detail_${id}`, PRODUCT_CACHE_TTL_MS);
}

export function setProductDetailCache(id: string, data: ProductDetail): void {
  setCached(`product_detail_${id}`, data);
}

export function getCartCount(): number | null {
  return getCached<number>('cartCount');
}

export function setCartCount(count: number): void {
  setCached('cartCount', count);
}
