import { beforeAll, describe, expect, it } from 'vitest';
import { loadKnowledgeBase } from './knowledge-base/knowledge-base.js';
import { consultar, crearTraza, detalleTraza, inicializarSistemaExperto, narrarTraza, resumirTraza } from './expert-system.service.js';
import { evaluar } from './inference-engine/engine.js';
import { REGLAS } from './rules/rules.js';
import type { Hecho } from './knowledge-base/kb.schemas.js';

function hechoTradicion(id: string, ambito: string): Hecho {
  return {
    id,
    tema: 'Tradición regional',
    afirmacion: 'Afirmación sobre la tradición local.',
    descripcion: 'Descripción del ritual de la comunidad.',
    categoria: 'tradiciones',
    ambito,
    fuentes: [{ fuenteId: 'F01', paginas: '1' }],
    estado: 'verified',
  };
}

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
      expect(result.opciones.length).toBe(5);
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

  it('responde sobre la sal gracias al lote 1 (antes: carencia honesta)', () => {
    const sal = consultar('¿Qué significa la sal?');
    expect(sal.type).toBe('texto');
    const agua = consultar('¿Qué significa el agua?');
    expect(agua.type).toBe('texto');
  });

  it('pide el elemento ante un significado ambiguo', () => {
    const result = consultar('¿Qué significa?');
    expect(result.type).toBe('pregunta_guiada');
    if (result.type === 'pregunta_guiada') {
      expect(result.opciones.length).toBeGreaterThan(5);
    }
  });

  it('responde sobre la calavera gracias al lote 2 (antes: carencia honesta)', () => {
    const result = consultar('¿Qué significa la calavera?');
    expect(result.type).toBe('texto');
  });

  it('resuelve la región respondida a la pregunta guiada (historial)', () => {
    const historial = [
      { rol: 'usuario', texto: 'quiero preparar una ofrenda' },
      { rol: 'asistente', texto: '¿Para qué región quieres la guía de ofrenda?' },
    ];
    const result = consultar('Puebla', historial);
    expect(result.type).toBe('resultado_se');
  });

  it('responde sobre el hanal pixán con hechos de Yucatán (lote 1)', () => {
    const result = consultar('¿Qué es el hanal pixán?');
    expect(result.type).toBe('texto');
  });

  it('responde sobre calaveritas y papel picado, y acota xantolo por región (lote 2)', () => {
    const calavera = consultar('¿Qué significan las calaveritas de azúcar?');
    expect(calavera.type).toBe('texto');
    const papel = consultar('¿Qué significa el papel picado?');
    expect(papel.type).toBe('texto');
    const xantolo = consultar('háblame del xantolo');
    expect(xantolo.type).toBe('pregunta_guiada');
    if (xantolo.type === 'pregunta_guiada') {
      expect(xantolo.texto).toContain('región');
    }
  });

  it('pregunta la región ante tradiciones de varias regiones (reglas + sintéticos)', () => {
    const sinteticos = [
      hechoTradicion('HS1', 'Puebla: valle de Texmelucan'),
      hechoTradicion('HS2', 'Campeche: Pomuch (maya)'),
    ];
    const { conclusion } = evaluar(
      { intencionId: 'tradicion', datos: {} },
      sinteticos,
      REGLAS,
    );
    expect(conclusion.tipo).toBe('pregunta_guiada');
  });

  it('la traza registra intención, regla y hechos sin alterar la respuesta', () => {
    const traza = crearTraza('¿Qué significa la sal?');
    const result = consultar('¿Qué significa la sal?', [], traza);
    expect(result.type).toBe('texto');
    expect(traza.intencionId).toBe('significado_elemento');
    expect(traza.reglaId).toBe('R-responder-hechos');
    expect(traza.hechos.map((h) => h.id)).toContain('H018');
    expect(traza.chequeos.length).toBeGreaterThan(0);
    expect(resumirTraza(traza)).toContain('H018');
    const detalle = detalleTraza(traza) as { regla: string; descartadas: string[] };
    expect(detalle.regla).toContain('R-responder-hechos');
    expect(detalle.descartadas).toContain('R-saludo');
    const narrativa = narrarTraza(traza).join('\n');
    expect(narrativa).toContain('intents/intents.ts::interpretar');
    expect(narrativa).toContain('R-responder-hechos.cuando => ✓');
    expect(narrativa).toContain('plantillas.ts::renderConclusion');
  });
});
