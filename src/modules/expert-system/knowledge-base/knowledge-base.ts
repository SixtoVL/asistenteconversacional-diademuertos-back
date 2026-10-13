import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { logger } from '../../../config/logger.js';
import { fuenteSchema, hechoSchema } from './kb.schemas.js';
import type { Fuente, Hecho } from './kb.schemas.js';

export interface BaseConocimientos {
  fuentes: Fuente[];
  /** Solo hechos aprobados (`verified`) con referencias resolvibles. */
  hechos: Hecho[];
}

function readJsonArray(dir: string, fileName: string): unknown {
  const raw = readFileSync(join(dir, fileName), 'utf8');
  return JSON.parse(raw) as unknown;
}

export function loadKnowledgeBase(dir?: string): BaseConocimientos {
  const baseDir = dir ?? dirname(fileURLToPath(import.meta.url));
  const fuentes = z.array(fuenteSchema).parse(readJsonArray(baseDir, 'fuentes.json'));
  const hechos = z.array(hechoSchema).parse(readJsonArray(baseDir, 'hechos.json'));

  const fuenteIds = new Set(fuentes.map((fuente) => fuente.id));
  const visto = new Set<string>();
  for (const hecho of hechos) {
    if (visto.has(hecho.id)) {
      throw new Error(`Hecho duplicado en la base de conocimientos: ${hecho.id}`);
    }
    visto.add(hecho.id);
  }

  const activos: Hecho[] = [];
  let ignorados = 0;
  for (const hecho of hechos) {
    if (hecho.estado !== 'verified') {
      ignorados += 1;
      continue;
    }
    const sinResolver = hecho.fuentes.filter((ref) => !fuenteIds.has(ref.fuenteId));
    if (sinResolver.length > 0) {
      throw new Error(
        `El hecho ${hecho.id} referencia fuentes inexistentes: ${sinResolver.map((ref) => ref.fuenteId).join(', ')}`,
      );
    }
    activos.push(hecho);
  }

  if (ignorados > 0) {
    logger.warn(`Base de conocimientos: ${ignorados} hecho(s) pendientes de revisión (no activos).`);
  }
  return { fuentes, hechos: activos };
}
