import { describe, expect, it } from 'vitest';
import { renderConclusion } from './plantillas.js';
import type { Fuente, Hecho } from './knowledge-base/kb.schemas.js';

const fuentes: Fuente[] = [
  {
    id: 'F01',
    titulo: 'Fuente de ejemplo',
    autor: 'Autora',
    anio: 2020,
    archivo: 'docs/fuentes/ejemplo.pdf',
    temas: ['tradiciones'],
  },
];

const hecho: Hecho = {
  id: 'H1',
  tema: 'Tema',
  afirmacion: 'Afirmación.',
  descripcion: 'Descripción.',
  categoria: 'tradiciones',
  ambito: 'general',
  fuentes: [{ fuenteId: 'F01', paginas: '1' }],
  estado: 'verified',
};

describe('renderConclusion', () => {
  it('texto incluye introducción, hechos y fuentes', () => {
    const result = renderConclusion({ tipo: 'texto', introduccion: 'Intro.', hechos: [hecho] }, fuentes);
    expect(result.type).toBe('texto');
    if (result.type === 'texto') {
      expect(result.texto).toContain('Intro.');
      expect(result.texto).toContain('Afirmación.');
      expect(result.fuentes?.[0]?.titulo).toContain('F01');
    }
  });

  it('pregunta_guiada pasa texto y opciones', () => {
    const opciones = [{ id: 'general', etiqueta: 'General' }];
    const result = renderConclusion({ tipo: 'pregunta_guiada', texto: '¿Región?', opciones }, fuentes);
    expect(result).toEqual({ type: 'pregunta_guiada', texto: '¿Región?', opciones });
  });

  it('resultado_se incluye justificación con la fuente', () => {
    const result = renderConclusion(
      { tipo: 'resultado_se', titulo: 'T', detalle: 'D', hechos: [hecho] },
      fuentes,
    );
    expect(result.type).toBe('resultado_se');
    if (result.type === 'resultado_se') {
      expect(result.justificacion).toContain('F01');
      expect(result.fuentes).toHaveLength(1);
    }
  });

  it('error usa el mensaje predefinido', () => {
    const result = renderConclusion({ tipo: 'error', codigo: 'consulta_no_reconocida' }, fuentes);
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.mensaje.length).toBeGreaterThan(0);
    }
  });
});
