import { buscarHechos } from '../inference-engine/engine.js';
import type { Caso, Conclusion, Regla } from '../inference-engine/engine.js';
import type { Hecho } from '../knowledge-base/kb.schemas.js';
import { REGIONES, buscarIntencion } from '../intents/intents.js';

const OPCIONES_REGION = REGIONES.map((region) => ({ id: region.id, etiqueta: region.etiqueta }));

function terminosDeIntencion(intencionId: string, datos: Record<string, string>): string[] {
  const intencion = buscarIntencion(intencionId);
  const terminos = intencion ? [...intencion.terminosBusqueda] : [];
  const elemento = datos['elemento'];
  if (elemento) {
    terminos.push(elemento);
  }
  return terminos;
}

function esInformativa(intencionId: string | null): boolean {
  return (
    intencionId === 'significado_elemento' ||
    intencionId === 'fechas' ||
    intencionId === 'historia' ||
    intencionId === 'tradicion'
  );
}

function buscarParaCaso(caso: Caso, hechos: Hecho[], limite = 3): Hecho[] {
  if (!caso.intencionId) {
    return [];
  }
  return buscarHechos(hechos, terminosDeIntencion(caso.intencionId, caso.datos), {
    region: caso.datos['region'],
    limite,
  });
}

export const REGLAS: Regla[] = [
  {
    id: 'R-saludo',
    descripcion: 'Saluda y presenta brevemente las capacidades del asistente.',
    prioridad: 10,
    cuando: (caso) => caso.intencionId === 'saludo',
    entonces: (): Conclusion => ({
      tipo: 'texto',
      introduccion:
        '¡Hola! Soy el asistente del Día de Muertos. Puedo contarte sobre la historia, las tradiciones y el significado de las ofrendas, o ayudarte a preparar la tuya. ¿Qué te gustaría saber?',
      hechos: [],
    }),
  },
  {
    id: 'R-ayuda',
    descripcion: 'Explica qué puede hacer el asistente con ejemplos de preguntas.',
    prioridad: 20,
    cuando: (caso) => caso.intencionId === 'ayuda',
    entonces: (): Conclusion => ({
      tipo: 'texto',
      introduccion:
        'Puedo ayudarte con: el significado de los elementos de la ofrenda (por ejemplo, ¿qué significa el cempasúchil?), las fechas de la celebración, su historia y tradiciones regionales. Si me dices "quiero preparar una ofrenda", te guiaré con preguntas.',
      hechos: [],
    }),
  },
  {
    id: 'R-recomendar-sin-region',
    descripcion: 'Si piden recomendación sin indicar región, pregunta la región con opciones.',
    prioridad: 30,
    cuando: (caso) => caso.intencionId === 'recomendar' && !caso.datos['region'],
    entonces: (): Conclusion => ({
      tipo: 'pregunta_guiada',
      texto: '¿Para qué región quieres la guía de ofrenda?',
      opciones: OPCIONES_REGION,
    }),
  },
  {
    id: 'R-recomendar-con-region',
    descripcion: 'Recomienda elementos de ofrenda solo con hechos de esa región.',
    prioridad: 40,
    cuando: (caso, hechos) =>
      caso.intencionId === 'recomendar' &&
      !!caso.datos['region'] &&
      buscarHechos(hechos, ['ofrenda'], { region: caso.datos['region'], limite: 4 }).length > 0,
    entonces: (caso, hechos): Conclusion => {
      const region = caso.datos['region'] ?? 'general';
      const encontrados = buscarHechos(hechos, ['ofrenda'], { region, limite: 4 });
      const etiqueta =
        REGIONES.find((item) => item.id === region)?.etiqueta ?? 'General';
      return {
        tipo: 'resultado_se',
        titulo: `Guía de ofrenda: ${etiqueta}`,
        detalle: encontrados.map((hecho) => `• ${hecho.afirmacion}`).join('\n'),
        hechos: encontrados,
      };
    },
  },
  {
    id: 'R-responder-hechos',
    descripcion: 'Responde consultas informativas con hechos verificados de la base.',
    prioridad: 50,
    cuando: (caso, hechos) =>
      esInformativa(caso.intencionId) && buscarParaCaso(caso, hechos).length > 0,
    entonces: (caso, hechos): Conclusion => ({
      tipo: 'texto',
      introduccion: 'Esto es lo que sé al respecto:',
      hechos: buscarParaCaso(caso, hechos),
    }),
  },
  {
    id: 'R-sin-hechos',
    descripcion: 'Si la intención es válida pero no hay hechos que la respalden, informa la carencia.',
    prioridad: 60,
    cuando: (caso) => caso.intencionId !== null,
    entonces: (): Conclusion => ({ tipo: 'error', codigo: 'datos_insuficientes' }),
  },
];
