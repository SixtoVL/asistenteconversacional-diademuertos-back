import type { Conclusion } from './inference-engine/engine.js';
import type { Fuente, Hecho } from './knowledge-base/kb.schemas.js';

export type ErrorCodigo =
  | 'consulta_no_reconocida'
  | 'datos_insuficientes'
  | 'entrada_invalida'
  | 'proveedor_no_disponible'
  | 'cuota_agotada'
  | 'tiempo_espera_excedido'
  | 'error_interno';

export interface FuenteRef {
  titulo: string;
}

export type ChatResponse =
  | { type: 'texto'; texto: string; fuentes?: FuenteRef[] }
  | { type: 'pregunta_guiada'; texto: string; opciones: Array<{ id: string; etiqueta: string }> }
  | { type: 'resultado_se'; titulo: string; detalle: string; justificacion: string; fuentes: FuenteRef[] }
  | { type: 'error'; codigo: ErrorCodigo; mensaje: string };

const MENSAJES_ERROR: Record<'consulta_no_reconocida' | 'datos_insuficientes', string> = {
  consulta_no_reconocida:
    'No entendí tu consulta. Puedo contarte sobre la historia, las tradiciones, las ofrendas y sus significados, o ayudarte a preparar una ofrenda.',
  datos_insuficientes:
    'Aún no tengo información verificada sobre eso. Prueba con otro tema del Día de Muertos.',
};

function fuentesUnicas(hechos: Hecho[], fuentes: Fuente[]): FuenteRef[] {
  const vistas = new Set<string>();
  const refs: FuenteRef[] = [];
  for (const hecho of hechos) {
    for (const ref of hecho.fuentes) {
      if (vistas.has(ref.fuenteId)) {
        continue;
      }
      vistas.add(ref.fuenteId);
      const fuente = fuentes.find((item) => item.id === ref.fuenteId);
      refs.push({ titulo: fuente ? `${ref.fuenteId} · ${fuente.titulo} (${fuente.anio})` : ref.fuenteId });
    }
  }
  return refs;
}

function justificacionFuentes(hechos: Hecho[], fuentes: Fuente[]): string {
  const refs = fuentesUnicas(hechos, fuentes);
  if (refs.length === 0) {
    return 'Recomendación elaborada a partir del conocimiento del sistema experto.';
  }
  return `Basado en: ${refs.map((ref) => ref.titulo).join('; ')}.`;
}

export function renderConclusion(conclusion: Conclusion, fuentes: Fuente[]): ChatResponse {
  switch (conclusion.tipo) {
    case 'texto': {
      const cuerpo = conclusion.hechos
        .map((hecho) => `• ${hecho.afirmacion} ${hecho.descripcion}`)
        .join('\n\n');
      return {
        type: 'texto',
        texto: conclusion.hechos.length > 0 ? `${conclusion.introduccion}\n\n${cuerpo}` : conclusion.introduccion,
        fuentes: fuentesUnicas(conclusion.hechos, fuentes),
      };
    }
    case 'pregunta_guiada':
      return { type: 'pregunta_guiada', texto: conclusion.texto, opciones: conclusion.opciones };
    case 'resultado_se':
      return {
        type: 'resultado_se',
        titulo: conclusion.titulo,
        detalle: conclusion.detalle,
        justificacion: justificacionFuentes(conclusion.hechos, fuentes),
        fuentes: fuentesUnicas(conclusion.hechos, fuentes),
      };
    case 'error':
      return { type: 'error', codigo: conclusion.codigo, mensaje: MENSAJES_ERROR[conclusion.codigo] };
  }
}
