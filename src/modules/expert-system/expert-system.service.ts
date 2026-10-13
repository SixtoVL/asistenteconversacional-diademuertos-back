import { evaluar } from './inference-engine/engine.js';
import type { Caso, Conclusion } from './inference-engine/engine.js';
import { interpretar, normalizar } from './intents/intents.js';
import type { BaseConocimientos } from './knowledge-base/knowledge-base.js';
import { renderConclusion } from './plantillas.js';
import type { ChatResponse } from './plantillas.js';
import { PREGUNTAS_GUIADAS, resolverRespuestaGuiada } from './dialogo.js';
import { REGLAS } from './rules/rules.js';
import { crearTraza, trazar } from './traza.js';
import type { MensajeHistorial, TrazaConsulta } from './traza.js';

export type { MensajeHistorial, TrazaConsulta };

let base: BaseConocimientos | null = null;

export function inicializarSistemaExperto(conocimientos: BaseConocimientos): void {
  base = conocimientos;
}

function hechosDeConclusion(conclusion: Conclusion): TrazaConsulta['hechos'] {
  if (conclusion.tipo === 'texto' || conclusion.tipo === 'resultado_se') {
    return conclusion.hechos;
  }
  return [];
}

function idPreguntaGuiada(textoAsistente: string): string | null {
  const pregunta = PREGUNTAS_GUIADAS.find(
    (item) => normalizar(item.texto) === normalizar(textoAsistente),
  );
  return pregunta?.id ?? null;
}

export function consultar(
  texto: string,
  historial: MensajeHistorial[] = [],
  traza?: TrazaConsulta,
): ChatResponse {
  if (!base) {
    throw new Error('El sistema experto no fue inicializado.');
  }
  const conocimientos: BaseConocimientos = base;
  const interpretacion = trazar(
    traza,
    'expert-system/intents/intents.ts',
    'interpretar',
    `"${texto}"`,
    () => interpretar(texto),
    (resultado) => `${resultado.intencionId ?? 'sin-intención'} ${JSON.stringify(resultado.datos)}`,
  );
  let caso: Caso = { intencionId: interpretacion.intencionId, datos: interpretacion.datos };
  if (traza) {
    traza.intencionId = caso.intencionId;
    traza.datos = caso.datos;
  }
  if (caso.intencionId === null) {
    const ultimoAsistente = [...historial].reverse().find((item) => item.rol === 'asistente');
    if (ultimoAsistente) {
      const resuelto = trazar(
        traza,
        'expert-system/dialogo.ts',
        'resolverRespuestaGuiada',
        `"${ultimoAsistente.texto}" → "${texto}"`,
        () => resolverRespuestaGuiada(ultimoAsistente.texto, texto),
        (resultado) =>
          resultado ? `${resultado.intencionId} ${JSON.stringify(resultado.datos)}` : 'sin coincidencia',
      );
      if (resuelto) {
        caso = resuelto;
        if (traza) {
          traza.resolucionGuiada = idPreguntaGuiada(ultimoAsistente.texto);
          traza.intencionId = caso.intencionId;
          traza.datos = caso.datos;
        }
      }
    }
  }
  const { conclusion } = evaluar(caso, conocimientos.hechos, REGLAS, traza);
  if (traza) {
    traza.hechos = hechosDeConclusion(conclusion);
    traza.respuestaTipo = conclusion.tipo;
  }
  return trazar(
    traza,
    'expert-system/plantillas.ts',
    'renderConclusion',
    conclusion.tipo,
    () => renderConclusion(conclusion, conocimientos.fuentes),
    (respuesta) => `${respuesta.type}`,
  );
}

function fraseIntencion(traza: TrazaConsulta): string {
  const datoRegion = traza.datos['region'];
  const datoElemento = traza.datos['elemento'];
  switch (traza.intencionId) {
    case 'recomendar':
      return `guía de ofrenda (${datoRegion ?? 'sin región'})`;
    case 'significado_elemento':
      return `significado de '${datoElemento ?? '?'}'`;
    case 'tradicion':
      return `tradiciones (${datoRegion ?? 'sin región'})`;
    case 'fechas':
      return 'fechas de la celebración';
    case 'historia':
      return 'historia';
    case 'saludo':
      return 'saludo';
    case 'ayuda':
      return 'ayuda';
    default:
      return 'consulta no reconocida';
  }
}

/** Línea resumen en español: qué se preguntó, qué se resolvió y con qué se respondió. */
export function resumirTraza(traza: TrazaConsulta): string {
  const baseResumen =
    traza.resolucionGuiada !== null
      ? `respuesta a guiada [${traza.resolucionGuiada}] → ${fraseIntencion(traza)}`
      : fraseIntencion(traza);
  if (traza.reglaId === null) {
    return `${baseResumen} → sin regla (${traza.respuestaTipo ?? 'error'})`;
  }
  const hechos =
    traza.hechos.length > 0 ? ` ${traza.hechos.length} hecho(s) [${traza.hechos.map((h) => h.id).join(', ')}]` : ' sin hechos';
  return `${baseResumen} → ${traza.reglaId}${hechos} → ${traza.respuestaTipo ?? ''}`;
}

/** Pasos entra/sale en líneas legibles: `→ archivo::fn(entrada)` + `← fn => salida (ms)`. */
export function narrarTraza(traza: TrazaConsulta): string[] {
  const lineas: string[] = [];
  for (const paso of traza.pasos) {
    if (paso.entrada === '') {
      lineas.push(`→ ${paso.archivo}::${paso.fn} => ${paso.salida}`);
    } else {
      lineas.push(`→ ${paso.archivo}::${paso.fn}(${paso.entrada})`);
      lineas.push(`← ${paso.fn} => ${paso.salida} (${paso.ms}ms)`);
    }
  }
  return lineas;
}

/** Bloque detalle con descripciones legibles (regla, descartadas, hechos con cita). */
export function detalleTraza(traza: TrazaConsulta): Record<string, unknown> {
  const regla = REGLAS.find((item) => item.id === traza.reglaId);
  return {
    intencion: traza.intencionId,
    datos: traza.datos,
    resolucionGuiada: traza.resolucionGuiada,
    pasos: traza.pasos,
    regla: regla ? `${regla.id} — ${regla.descripcion}` : null,
    descartadas: traza.chequeos.filter((c) => !c.matched).map((c) => c.regla),
    hechos: traza.hechos.map(
      (hecho) =>
        `${hecho.id} — ${hecho.tema} (${hecho.fuentes.map((ref) => `${ref.fuenteId}, p. ${ref.paginas}`).join('; ')})`,
    ),
  };
}

export { crearTraza };
