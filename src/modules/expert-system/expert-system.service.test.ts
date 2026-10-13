import { beforeAll, describe, expect, it } from 'vitest';
import { loadKnowledgeBase } from './knowledge-base/knowledge-base.js';
import { consultar, inicializarSistemaExperto } from './expert-system.service.js';

beforeAll(() => {
  inicializarSistemaExperto(loadKnowledgeBase());
});

describe('consultar (KB real)', () => {
  it('responde texto ante significado de elemento', () => {
    const result = consultar('¿Qué significa la flor de cempasúchil?');
    expect(result.type).toBe('texto');
  });

  it('pregunta la región ante recomendación sin región', () => {
    const result = consultar('quiero preparar una ofrenda');
    expect(result.type).toBe('pregunta_guiada');
    if (result.type === 'pregunta_guiada') {
      expect(result.opciones.length).toBe(4);
    }
  });

  it('recomienda con región en el mismo mensaje', () => {
    const result = consultar('recomienda una ofrenda para Puebla');
    expect(result.type).toBe('resultado_se');
    if (result.type === 'resultado_se') {
      expect(result.justificacion).toContain('F04');
    }
  });

  it('saluda ante un saludo', () => {
    const result = consultar('hola');
    expect(result.type).toBe('texto');
  });

  it('error ante consulta no reconocida', () => {
    const result = consultar('dksjfh qwerty zzzz');
    expect(result).toEqual({
      type: 'error',
      codigo: 'consulta_no_reconocida',
      mensaje: expect.any(String),
    });
  });
});
