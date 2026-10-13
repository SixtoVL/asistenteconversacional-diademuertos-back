import { describe, expect, it } from 'vitest';
import { chatRequestSchema } from './chat.schemas.js';

describe('chatRequestSchema', () => {
  it('acepta una petición válida en modo experto', () => {
    const result = chatRequestSchema.safeParse({
      mensajes: [{ rol: 'usuario', texto: '¿Qué significa la flor de cempasúchil?' }],
      ajustes: { modo: 'experto', proveedor: 'gemini', modelo: 'gemini-2.0-flash' },
    });
    expect(result.success).toBe(true);
  });

  it('rechaza un historial vacío', () => {
    const result = chatRequestSchema.safeParse({
      mensajes: [],
      ajustes: { modo: 'experto', proveedor: 'gemini', modelo: 'gemini-2.0-flash' },
    });
    expect(result.success).toBe(false);
  });

  it('rechaza un modo inválido', () => {
    const result = chatRequestSchema.safeParse({
      mensajes: [{ rol: 'usuario', texto: 'Hola' }],
      ajustes: { modo: 'oraculo', proveedor: 'gemini', modelo: 'gemini-2.0-flash' },
    });
    expect(result.success).toBe(false);
  });
});
