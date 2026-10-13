import { ELEMENTOS, REGIONES, normalizar } from './intents/intents.js';
import type { Caso } from './inference-engine/engine.js';

export interface PreguntaGuiada {
  id: string;
  texto: string;
  intencionId: string;
  claveDato: 'region' | 'elemento';
  opciones: Array<{ id: string; etiqueta: string }>;
}

function etiquetaElemento(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export const PREGUNTAS_GUIADAS: PreguntaGuiada[] = [
  {
    id: 'region-ofrenda',
    texto: '¿Para qué región quieres la guía de ofrenda?',
    intencionId: 'recomendar',
    claveDato: 'region',
    opciones: REGIONES.map((region) => ({ id: region.id, etiqueta: region.etiqueta })),
  },
  {
    id: 'region-tradicion',
    texto: '¿De qué región te interesan las tradiciones?',
    intencionId: 'tradicion',
    claveDato: 'region',
    opciones: REGIONES.map((region) => ({ id: region.id, etiqueta: region.etiqueta })),
  },
  {
    id: 'elemento-significado',
    texto: '¿Sobre qué elemento de la ofrenda quieres saber su significado?',
    intencionId: 'significado_elemento',
    claveDato: 'elemento',
    opciones: ELEMENTOS.map((elemento) => ({
      id: elemento.id,
      etiqueta: etiquetaElemento(elemento.id),
    })),
  },
];

export function buscarPreguntaGuiada(id: string): PreguntaGuiada | null {
  return PREGUNTAS_GUIADAS.find((pregunta) => pregunta.id === id) ?? null;
}

/**
 * Resuelve la respuesta del usuario a una pregunta guiada anterior.
 * Stateless: compara contra el último mensaje del asistente que viaja en el historial.
 */
export function resolverRespuestaGuiada(
  textoAsistente: string,
  textoUsuario: string,
): Caso | null {
  const pregunta = PREGUNTAS_GUIADAS.find(
    (item) => normalizar(item.texto) === normalizar(textoAsistente),
  );
  if (!pregunta) {
    return null;
  }
  const respuesta = normalizar(textoUsuario);
  const opcion = pregunta.opciones.find(
    (item) => normalizar(item.id) === respuesta || normalizar(item.etiqueta) === respuesta,
  );
  if (!opcion) {
    return null;
  }
  return { intencionId: pregunta.intencionId, datos: { [pregunta.claveDato]: opcion.id } };
}
