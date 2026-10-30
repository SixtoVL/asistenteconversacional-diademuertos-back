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
      expect(result.opciones.length).toBe(7);
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
    expect(result.type).toBe('resultado_se');
    if (result.type === 'resultado_se') {
      expect(result.titulo).toContain('Yucatán');
    }
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

  it('responde la historia de los orígenes gracias al lote 3 (antes: carencia honesta)', () => {
    const origen = consultar('¿Cuál es el origen prehispánico del Día de Muertos?');
    expect(origen.type).toBe('texto');
    const miccailhuitontli = consultar('¿Qué era el miccailhuitontli?');
    expect(miccailhuitontli.type).toBe('texto');
    const fechas = consultar('¿Por qué se celebra el 1 y 2 de noviembre?');
    expect(fechas.type).toBe('texto');
  });

  it('responde Xantolo y Chicontepec con las regiones nuevas (lote 4)', () => {
    const xantolo = consultar('háblame del xantolo');
    expect(xantolo.type).toBe('pregunta_guiada');
    if (xantolo.type === 'pregunta_guiada') {
      expect(xantolo.texto).toContain('región');
    }
    const chicontepec = consultar('tradiciones en Chicontepec');
    expect(chicontepec.type).toBe('resultado_se');
    const michoacan = consultar('tradiciones de Michoacán');
    expect(michoacan.type).toBe('resultado_se');
    if (michoacan.type === 'resultado_se') {
      expect(michoacan.detalle).toContain('Cuanajo');
    }
  });

  it('lista los elementos de la ofrenda con la intención y regla nuevas', () => {
    const lista = consultar('¿Qué elementos lleva una ofrenda?');
    expect(lista.type).toBe('texto');
    if (lista.type === 'texto') {
      expect(lista.texto).toContain('ofrenda');
    }
    const tradicionRegion = consultar('tradiciones de Yucatán');
    expect(tradicionRegion.type).toBe('resultado_se');
    if (tradicionRegion.type === 'resultado_se') {
      expect(tradicionRegion.titulo).toContain('Yucatán');
    }
  });

  it('responde Huaquechula e Izúcar con el lote 5 (antes: carencia honesta)', () => {
    const huaquechula = consultar('tradiciones de Huaquechula');
    expect(huaquechula.type).toBe('resultado_se');
    if (huaquechula.type === 'resultado_se') {
      expect(huaquechula.detalle).toContain('Huaquechula');
    }
    const itacate = consultar('¿Qué es el itacate?');
    expect(itacate.type).toBe('texto');
    const muertosViolentos = consultar('¿Qué pasa con los muertos violentos en Xayacatlán?');
    expect(muertosViolentos.type).toBe('resultado_se');
  });

  it('responde la levantada de la cruz y el montaje de Huaquechula (lote 6)', () => {
    const levantada = consultar('háblame de la levantada de la cruz en Izúcar');
    expect(levantada.type).toBe('resultado_se');
    if (levantada.type === 'resultado_se') {
      expect(levantada.titulo).toContain('Puebla');
    }
    const montaje = consultar('tradiciones del montaje de ofrendas en Huaquechula');
    expect(montaje.type).toBe('resultado_se');
  });

  it('se despide ante una despedida (antes: no entendía)', () => {
    const result = consultar('adiós, gracias');
    expect(result.type).toBe('texto');
    if (result.type === 'texto') {
      expect(result.texto).toContain('Vuelve');
    }
  });

  it('varía el saludo cuando el usuario repite hola (antes: respuesta idéntica)', () => {
    const primero = consultar('hola');
    expect(primero.type).toBe('texto');
    if (primero.type === 'texto') {
      expect(primero.texto).toContain('¡Hola!');
    }
    const historial = [
      { rol: 'usuario', texto: 'hola' },
      { rol: 'asistente', texto: primero.type === 'texto' ? primero.texto : '' },
    ];
    const segundo = consultar('hola', historial);
    expect(segundo.type).toBe('texto');
    if (segundo.type === 'texto') {
      expect(segundo.texto).toContain('Ya te saludé');
      expect(segundo.texto).not.toContain('¡Hola!');
    }
  });

  it('responde petate, avisa regiones sin datos y agradece (huecos del corpus)', () => {
    const petate = consultar('¿Qué significa el petate?');
    expect(petate.type).toBe('texto');
    if (petate.type === 'texto') {
      expect(petate.texto).toContain('petate');
    }
    const sinDatos = consultar('¿Qué significa el petate en Yucatán?');
    expect(sinDatos.type).toBe('texto');
    if (sinDatos.type === 'texto') {
      expect(sinDatos.texto).toContain('Yucatán');
      expect(sinDatos.texto).toContain('Puebla');
    }
    const gracias = consultar('gracias');
    expect(gracias.type).toBe('texto');
    if (gracias.type === 'texto') {
      expect(gracias.texto).toContain('De nada');
    }
  });

  it('responde novenario, angelitos, alfeñique y catrinas con el corpus existente', () => {
    const novenario = consultar('háblame del novenario en Izúcar');
    expect(novenario.type).toBe('resultado_se');
    if (novenario.type === 'resultado_se') {
      expect(novenario.detalle).toContain('novenario');
    }
    const angelitos = consultar('angelitos de Michoacán');
    expect(angelitos.type).toBe('resultado_se');
    if (angelitos.type === 'resultado_se') {
      expect(angelitos.detalle).toContain('angelitos');
    }
    const alfenique = consultar('¿Qué significa el alfeñique?');
    expect(alfenique.type).toBe('texto');
    if (alfenique.type === 'texto') {
      expect(alfenique.texto).toContain('alfeñique');
    }
    const alfeniqueRegion = consultar('dulces de alfeñique');
    expect(alfeniqueRegion.type).toBe('pregunta_guiada');
    const catrinas = consultar('catrinas de Campeche');
    expect(catrinas.type).toBe('resultado_se');
    if (catrinas.type === 'resultado_se') {
      expect(catrinas.detalle).toContain('Pixanes');
    }
    const copal = consultar('¿Qué significa el copal?');
    expect(copal.type).toBe('texto');
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
