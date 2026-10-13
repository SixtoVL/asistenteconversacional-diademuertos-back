import { describe, expect, it } from 'vitest';
import { interpretar, normalizar } from './intents.js';

describe('normalizar', () => {
  it('pasa a minúsculas, quita acentos y colapsa espacios', () => {
    expect(normalizar('  ¿QUÉ significa el CEMPASÚCHIL?  ')).toBe('¿que significa el cempasuchil?');
  });
});

describe('interpretar', () => {
  it('detecta saludo', () => {
    expect(interpretar('Hola, buenas tardes').intencionId).toBe('saludo');
  });

  it('detecta significado con mayúsculas y acentos, y extrae el elemento', () => {
    const result = interpretar('¿QUÉ SIGNIFICA el cempasúchil?');
    expect(result.intencionId).toBe('significado_elemento');
    expect(result.datos['elemento']).toBe('cempasuchil');
  });

  it('detecta recomendación y región en el mismo mensaje', () => {
    const result = interpretar('Recomiéndame una ofrenda para Puebla');
    expect(result.intencionId).toBe('recomendar');
    expect(result.datos['region']).toBe('puebla');
  });

  it('detecta fechas', () => {
    expect(interpretar('¿Cuándo se celebra?').intencionId).toBe('fechas');
  });

  it('detecta historia', () => {
    expect(interpretar('Cuéntame del patrimonio UNESCO').intencionId).toBe('historia');
  });

  it('devuelve nulo ante texto sin coincidencias', () => {
    const result = interpretar('dksjfh qwerty zzzz');
    expect(result.intencionId).toBeNull();
  });

  it('la etiqueta de opción de región es matcheable', () => {
    const result = interpretar('Campeche');
    expect(result.datos['region']).toBe('campeche');
  });
});
