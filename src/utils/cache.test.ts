import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCached, setCached } from './cache';

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve los datos originales para una entrada fresca', () => {
    vi.setSystemTime(new Date('2026-07-30T10:00:00Z'));
    setCached('key', { foo: 'bar' });

    const result = getCached<{ foo: string }>('key');

    expect(result).toEqual({ foo: 'bar' });
  });

  it('devuelve null y limpia la clave para una entrada expirada', () => {
    vi.setSystemTime(new Date('2026-07-30T10:00:00Z'));
    setCached('key', { foo: 'bar' });

    vi.setSystemTime(new Date('2026-07-30T11:00:00.001Z'));
    const result = getCached<{ foo: string }>('key');

    expect(result).toBeNull();
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('devuelve null para una clave inexistente', () => {
    const result = getCached('missing-key');

    expect(result).toBeNull();
  });

  it('devuelve null y no lanza para JSON corrupto', () => {
    localStorage.setItem('key', 'not json');

    const result = getCached('key');

    expect(result).toBeNull();
    expect(localStorage.getItem('key')).toBeNull();
  });
});
