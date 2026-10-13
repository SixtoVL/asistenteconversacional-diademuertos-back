import { describe, expect, it } from 'vitest';
import { buscarHechos, coincideRegion, evaluar } from './engine.js';
import type { Hecho } from '../knowledge-base/kb.schemas.js';
import type { Regla } from './engine.js';

function hechoBase(sobreescritura: Partial<Hecho> = {}): Hecho {
  return {
    id: 'HX',
    tema: 'Tema',
    afirmacion: 'Afirmación sobre ofrendas.',
    descripcion: 'Descripción general.',
    categoria: 'tradiciones',
    ambito: 'general',
    fuentes: [{ fuenteId: 'F01', paginas: '1' }],
    estado: 'verified',
    ...sobreescritura,
  };
}

describe('evaluar', () => {
  it('elige la regla de menor prioridad entre las que matchean', () => {
    const reglas: Regla[] = [
      { id: 'baja', descripcion: '', prioridad: 20, cuando: () => true, entonces: () => ({ tipo: 'error', codigo: 'datos_insuficientes' }) },
      { id: 'alta', descripcion: '', prioridad: 10, cuando: () => true, entonces: () => ({ tipo: 'texto', introduccion: 'hola', hechos: [] }) },
    ];
    const conclusion = evaluar({ intencionId: 'saludo', datos: {} }, [], reglas);
    expect(conclusion.tipo).toBe('texto');
  });

  it('devuelve consulta_no_reconocida sin reglas que matcheen', () => {
    const conclusion = evaluar({ intencionId: null, datos: {} }, [], []);
    expect(conclusion).toEqual({ tipo: 'error', codigo: 'consulta_no_reconocida' });
  });
});

describe('buscarHechos', () => {
  const hechos = [
    hechoBase({ id: 'H1', afirmacion: 'El cempasúchil guía a las ánimas.' }),
    hechoBase({ id: 'H2', afirmacion: 'El pan de muerto es solo de esta época.', ambito: 'Puebla: valle de Texmelucan' }),
  ];

  it('ordena por puntaje y respeta el límite', () => {
    const result = buscarHechos(hechos, ['cempasuchil'], { limite: 1 });
    expect(result.map((hecho) => hecho.id)).toEqual(['H1']);
  });

  it('filtra por región', () => {
    const result = buscarHechos(hechos, ['pan'], { region: 'puebla' });
    expect(result.map((hecho) => hecho.id)).toEqual(['H2']);
  });

  it('devuelve vacío sin coincidencias', () => {
    expect(buscarHechos(hechos, ['xyz'])).toEqual([]);
  });
});

describe('coincideRegion', () => {
  it('matchea general y México', () => {
    expect(coincideRegion('general', 'general')).toBe(true);
    expect(coincideRegion('México (mestizo)', 'general')).toBe(true);
    expect(coincideRegion('Puebla: valle', 'general')).toBe(false);
  });

  it('matchea regiones por subcadena insensible a acentos', () => {
    expect(coincideRegion('Puebla: San Miguel Canoa', 'puebla')).toBe(true);
    expect(coincideRegion('Campeche: Pomuch (maya)', 'campeche')).toBe(true);
    expect(coincideRegion('Nayarit: pueblo cora', 'nayarit')).toBe(true);
  });
});
