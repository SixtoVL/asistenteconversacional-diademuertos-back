import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadKnowledgeBase } from './knowledge-base.js';

const dirsTemporales: string[] = [];

afterEach(() => {
  while (dirsTemporales.length > 0) {
    const dir = dirsTemporales.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function crearKbTemporal(hechos: unknown[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'kb-test-'));
  dirsTemporales.push(dir);
  writeFileSync(
    join(dir, 'fuentes.json'),
    JSON.stringify([
      {
        id: 'F01',
        titulo: 'Fuente de ejemplo',
        autor: 'Autor de ejemplo',
        anio: 2020,
        archivo: 'docs/fuentes/ejemplo.pdf',
        temas: ['tradiciones'],
      },
    ]),
  );
  writeFileSync(join(dir, 'hechos.json'), JSON.stringify(hechos));
  return dir;
}

function hechoBase(sobreescritura: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'HX',
    tema: 'Tema',
    afirmacion: 'Afirmación.',
    descripcion: 'Descripción.',
    categoria: 'tradiciones',
    ambito: 'general',
    fuentes: [{ fuenteId: 'F01', paginas: '1' }],
    estado: 'verified',
    ...sobreescritura,
  };
}

describe('loadKnowledgeBase', () => {
  it('carga la base real con hechos verificados y referencias resolvibles', () => {
    const kb = loadKnowledgeBase();
    expect(kb.fuentes.length).toBeGreaterThan(0);
    expect(kb.hechos.length).toBeGreaterThanOrEqual(12);
    expect(kb.hechos.every((hecho) => hecho.estado === 'verified')).toBe(true);
    const fuenteIds = new Set(kb.fuentes.map((fuente) => fuente.id));
    expect(
      kb.hechos.every((hecho) => hecho.fuentes.every((ref) => fuenteIds.has(ref.fuenteId))),
    ).toBe(true);
  });

  it('filtra los hechos pendientes de revisión', () => {
    const dir = crearKbTemporal([
      hechoBase({ id: 'H1', estado: 'verified' }),
      hechoBase({ id: 'H2', estado: 'pending' }),
    ]);
    const kb = loadKnowledgeBase(dir);
    expect(kb.hechos.map((hecho) => hecho.id)).toEqual(['H1']);
  });

  it('falla ante referencias a fuentes inexistentes', () => {
    const dir = crearKbTemporal([hechoBase({ id: 'H1', fuentes: [{ fuenteId: 'FX', paginas: '1' }] })]);
    expect(() => loadKnowledgeBase(dir)).toThrow();
  });

  it('falla ante identificadores duplicados', () => {
    const dir = crearKbTemporal([hechoBase({ id: 'H1' }), hechoBase({ id: 'H1' })]);
    expect(() => loadKnowledgeBase(dir)).toThrow();
  });
});
