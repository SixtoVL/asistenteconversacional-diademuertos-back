import { describe, expect, it } from 'vitest';
import { hechoSchema } from './kb.schemas.js';

const hechoValido = {
  id: 'H999',
  tema: 'Tema de ejemplo',
  afirmacion: 'Afirmación de ejemplo.',
  descripcion: 'Descripción de ejemplo.',
  categoria: 'tradiciones',
  ambito: 'general',
  fuentes: [{ fuenteId: 'F01', paginas: '1' }],
  estado: 'verified',
};

describe('hechoSchema', () => {
  it('acepta un hecho válido', () => {
    expect(hechoSchema.safeParse(hechoValido).success).toBe(true);
  });

  it('rechaza un hecho sin fuentes', () => {
    const result = hechoSchema.safeParse({ ...hechoValido, fuentes: [] });
    expect(result.success).toBe(false);
  });

  it('rechaza un estado desconocido', () => {
    const result = hechoSchema.safeParse({ ...hechoValido, estado: 'publicado' });
    expect(result.success).toBe(false);
  });

  it('rechaza una categoría desconocida', () => {
    const result = hechoSchema.safeParse({ ...hechoValido, categoria: 'mitos' });
    expect(result.success).toBe(false);
  });
});
