# SPEC — Estándar Backend: Node.js + TypeScript + Express

**Versión:** 1.0
**Estado:** Especificación técnica inicial
**Ecosistema:** Node.js + TypeScript + Express + zod + Vitest

---

## 1. Descripción General

Definir los estándares de arquitectura, organización de archivos, contrato API, validación, gestión del sistema experto y de proveedores LLM para el backend del Asistente Conversacional del Día de Muertos.

Esta especificación concreta las decisiones de arquitectura del proyecto: backend **stateless**, sin base de datos en las fases iniciales, sistema experto como autoridad de las reglas de negocio y LLM opcional y configurable detrás de una capa de abstracción.

---

## 2. Principios de Diseño

1. **Stateless:** el backend no mantiene sesión ni estado de conversación en el servidor. El frontend envía el contexto necesario en cada petición.
2. **El sistema experto manda:** ninguna respuesta puede contradecir las reglas; el LLM interpreta y redacta, nunca decide.
3. **Validación total en backend:** toda entrada se valida con esquemas `zod`, venga del usuario o del LLM. Nunca se confía en el frontend.
4. **Contrato explícito:** dos endpoints de chat separados (JSON y SSE) con formas de mensaje versionadas y documentadas.
5. **Tipado estricto:** TypeScript en modo `strict`, prohibido `any`; los datos externos se tipan como `unknown` y se validan.
6. **Sin acoplamiento a proveedores:** el chat y el sistema experto no conocen detalles de Gemini, OpenAI o Groq.

---

## 3. Estructura del Proyecto

```plaintext
src/
├── modules/
│   ├── chat/
│   │   ├── chat.controller.ts   # Adaptadores HTTP: /chat y /chat/stream
│   │   ├── chat.service.ts      # Orquestación del flujo conversacional
│   │   ├── chat.schemas.ts      # Esquemas zod de entrada/salida
│   │   └── chat.routes.ts       # Definición de rutas del módulo
│   ├── expert-system/
│   │   ├── inference-engine/    # Motor de inferencia puro y testeable
│   │   ├── knowledge-base/      # Carga y validación de hechos (JSON versionado)
│   │   ├── intents/             # Intenciones y patrones del interpretador básico
│   │   ├── rules/               # Reglas de inferencia y de negocio (TypeScript)
│   │   └── expert-system.service.ts
│   └── llm/
│       ├── llm.types.ts         # Interfaz común LlmProvider y DTOs internos
│       ├── llm.service.ts       # Selección de proveedor/modelo y orquestación
│       ├── llm.schemas.ts       # Esquemas del structured output esperado del LLM
│       └── providers/
│           ├── gemini.provider.ts
│           ├── openai.provider.ts
│           └── groq.provider.ts
├── config/
│   ├── env.ts                   # Lectura y validación de variables de entorno
│   └── llm.config.ts            # Catálogo de proveedores/modelos habilitados
├── middlewares/
│   ├── error-handler.ts         # Formato normalizado de errores
│   └── validate.ts              # Validación de cuerpos con zod (si aplica)
├── app.ts
└── server.ts
```

---

## 4. Contrato API

### 4.1. Tipos de mensaje (envelope)

Toda respuesta del chat usa una unión discriminada por `type`. El frontend la valida con `zod` antes de renderizar.

```typescript
type ChatResponse =
  | { type: 'texto'; texto: string; fuentes?: FuenteRef[] }
  | { type: 'pregunta_guiada'; texto: string; opciones: OpcionGuiada[] }
  | { type: 'resultado_se'; titulo: string; detalle: string; justificacion: string; fuentes?: FuenteRef[] }
  | { type: 'error'; codigo: ErrorCodigo; mensaje: string };

interface OpcionGuiada {
  id: string;
  etiqueta: string;
}

interface FuenteRef {
  titulo: string;
  institucion?: string;
}

type ErrorCodigo =
  | 'consulta_no_reconocida'
  | 'datos_insuficientes'
  | 'entrada_invalida'
  | 'proveedor_no_disponible'
  | 'cuota_agotada'
  | 'tiempo_espera_excedido'
  | 'error_interno';
```

### 4.2. `POST /api/chat` — modo clásico (JSON único)

Usado cuando el LLM está desactivado. El sistema experto responde con plantillas; la respuesta llega completa en una sola petición.

**Request:**

```jsonc
{
  "mensajes": [
    { "rol": "usuario", "texto": "¿Qué significa la flor de cempasúchil?" }
  ],
  "ajustes": { "modo": "experto", "proveedor": "gemini", "modelo": "gemini-2.0-flash" }
}
```

- `mensajes`: historial reciente, máximo `CHAT_MAX_HISTORY` (20 por defecto). Solo se aceptan roles `usuario` y `asistente`.
- `ajustes.modo`: `'experto' | 'llm'`. En este endpoint solo se admite `'experto'`; si llega `'llm'`, se responde `400` (`entrada_invalida`).
- `ajustes.proveedor/modelo`: se validan contra el catálogo aunque no se usen en este endpoint, para detectar selecciones obsoletas cuanto antes.

**Response:** `200` con un `ChatResponse`. Errores de validación: `400` con forma `{ type: 'error', codigo: 'entrada_invalida', mensaje }`.

### 4.3. `POST /api/chat/stream` — modo LLM (SSE)

Usado cuando el LLM está activado. El backend interpreta con el LLM, decide con el sistema experto y explica con el LLM en streaming.

**Request:** misma forma que `4.2`, pero con `ajustes.modo: 'llm'`. Si llega `'experto'`, se responde `400`.

**Response:** `Content-Type: text/event-stream`, eventos:

```text
event: fragmento
data: {"texto": "La flor de cempasúchil..."}

event: fragmento
data: {"texto": " guía a las almas..."}

event: resultado
data: {"type": "resultado_se", "titulo": "...", "detalle": "...", "justificacion": "..."}

event: fin
data: {}
```

- Los eventos `fragmento` son la explicación redactada por el LLM (progresiva, para renderizado en tiempo real con spinner hasta el primer fragmento).
- El evento `resultado` contiene el `ChatResponse` final **ya validado** por el sistema experto. Si el LLM propone algo que contradice las reglas, el resultado refleja la decisión del SE, no la del modelo.
- Ante fallo del proveedor a mitad del stream, se emite `event: error` con un `ChatResponse` de tipo `error` (`proveedor_no_disponible`, `cuota_agotada` o `tiempo_espera_excedido`) y se cierra el stream. El frontend debe ofrecer volver al modo clásico.

### 4.4. `GET /api/llm/providers` — catálogo habilitado

Devuelve los proveedores y modelos habilitados por la configuración del backend. Es la **única fuente de verdad** para la pill de selección del frontend.

```jsonc
{
  "proveedores": [
    {
      "id": "gemini",
      "etiqueta": "Gemini",
      "modelos": [
        { "id": "gemini-2.0-flash", "etiqueta": "2.0 Flash" },
        { "id": "gemini-1.5-flash", "etiqueta": "1.5 Flash" }
      ]
    }
  ],
  "predeterminado": { "proveedor": "gemini", "modelo": "gemini-2.0-flash" }
}
```

### 4.5. `GET /health`

Existe en el boilerplate. Responde `200` con `{ "status": "ok" }`.

---

## 5. Flujo de Procesamiento (stateless)

1. El frontend envía `mensajes` (historial reciente) + `ajustes` en cada petición. El backend no guarda sesión.
2. El backend valida el cuerpo con `zod`: estructura, roles, longitud máxima, `CHAT_MAX_HISTORY` y selección de proveedor/modelo contra el catálogo.
3. Si el modo es `experto`: se usa el interpretador básico (intenciones/patrones) sobre el último mensaje del usuario.
4. Si el modo es `llm` (solo `/chat/stream`): el LLM interpreta la consulta y devuelve datos estructurados según `llm.schemas.ts`. Si el estructurado no valida, se trata como `datos_insuficientes` o se reintenta una vez; nunca se pasa dato sin validar al motor.
5. El sistema experto evalúa los datos validados con el motor de inferencia y produce conclusiones.
6. El backend aplica las validaciones de negocio sobre el resultado.
7. En modo `experto`: se genera la respuesta con plantillas y se devuelve el `ChatResponse` completo.
8. En modo `llm`: el resultado validado se envía al LLM para explicación en streaming (`fragmento`), y al final se emite el `resultado` validado.
9. Si el proveedor LLM falla: se emite error tipificado y se ofrece el modo clásico. Nunca se afirma haber usado el sistema experto si el procesamiento no se completó.

---

## 6. Sistema Experto

### 6.1. Base de conocimientos

- Hechos en archivos **JSON versionados** dentro de `knowledge-base/`, con el esquema definido en la especificación de la base de conocimientos (identificador, tema, afirmación, categoría, ámbito, fuente, estado de revisión).
- Al arrancar, el backend **carga y valida** los JSON con `zod`. Solo los hechos con estado aprobado participan en la inferencia; los pendientes o rechazados se ignoran (y se registran en log).
- El acceso a los hechos se encapsula en el servicio; el motor nunca lee archivos directamente.

### 6.2. Intenciones y patrones del interpretador

- Las intenciones, palabras clave y patrones del modo clásico viven versionados en `expert-system/intents/` (TypeScript o JSON validado), separados de los hechos culturales.
- Cada intención documenta: identificador, ejemplos de consultas, datos que extrae y regla(s) que puede activar.

### 6.3. Reglas y motor

- Reglas de inferencia y de negocio en TypeScript dentro de `expert-system/rules/`, con identificador, condiciones, conclusión, prioridad y casos de prueba asociados.
- El motor (`inference-engine/`) es código puro: recibe hechos + datos del caso y devuelve conclusiones, sin E/S ni dependencias de proveedores.
- No se ejecuta código arbitrario proveniente de archivos de datos.

---

## 7. Módulo LLM

### 7.1. Interfaz común

```typescript
interface InterpretacionConsulta {
  intencion: string;
  datos: Record<string, string | number | boolean>;
  faltantes: string[];
  necesitaAclaracion: boolean;
  preguntaAclaratoria?: string;
}

interface LlmProvider {
  id: string;
  interpretar(consulta: string, historial: MensajeHistorial[]): Promise<InterpretacionConsulta>;
  explicar(resultado: ResultadoExperto, historial: MensajeHistorial[]): AsyncIterable<string>;
}
```

- `interpretar` devuelve **structured output** validado contra `llm.schemas.ts`.
- `explicar` devuelve un iterable asíncrono de fragmentos (streaming) para reenviar por SSE.
- Cada adaptador normaliza errores de su proveedor a los códigos de `4.1` y respeta `LLM_TIMEOUT_MS`.

### 7.2. Proveedores iniciales

Gemini, OpenAI y Groq, con modelos gratuitos o de bajo costo como primera opción (el catálogo exacto vive en `config/llm.config.ts` y se expone por `GET /api/llm/providers`). Incorporar un proveedor nuevo implica solo agregar un adaptador que implemente `LlmProvider` y registrarlo en la configuración.

---

## 8. Validación, Seguridad y Errores

### 8.1. Validación

- Todo cuerpo de petición se valida con `zod` antes de cualquier lógica de negocio.
- Se comprueban: estructura, tipos, valores permitidos, campos obligatorios, coherencia entre datos, longitud máxima de textos e historial acotado a `CHAT_MAX_HISTORY`.
- La selección de proveedor/modelo se valida contra el catálogo habilitado en cada petición.

### 8.2. Seguridad

- Las API keys viven **solo en el backend** (variables de entorno o gestor de secretos). Nunca en el frontend ni en el repositorio.
- CORS restringido a `FRONTEND_ORIGIN` (sin comodines en producción).
- Cabeceras de seguridad básicas y `express.json()` con límite de tamaño.
- Sin autenticación en el MVP. El **rate limiting por IP queda explícitamente fuera del alcance inicial** y se evaluará si se detecta abuso de las cuotas gratuitas.

### 8.3. Errores

- Middleware central que devuelve siempre la forma `{ type: 'error', codigo, mensaje }` con el código HTTP correspondiente (400 validación, 502 proveedor, 504 timeout, 500 interno).
- Nunca se exponen detalles internos (stack traces, claves, respuestas crudas del proveedor) al cliente.
- Se registra en log cada fallo de proveedor con proveedor, modelo, latencia y código mapeado.

---

## 9. Configuración (variables de entorno)

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto del servidor | `3000` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS | `http://localhost:5173` |
| `GEMINI_API_KEY` | Clave de Gemini (requerida si el proveedor está habilitado) | — |
| `OPENAI_API_KEY` | Clave de OpenAI (requerida si el proveedor está habilitado) | — |
| `GROQ_API_KEY` | Clave de Groq (requerida si el proveedor está habilitado) | — |
| `LLM_ENABLED_PROVIDERS` | Proveedores habilitados (separados por coma) | `gemini,groq` |
| `LLM_TIMEOUT_MS` | Timeout por llamada al proveedor | `15000` |
| `CHAT_MAX_HISTORY` | Máximo de mensajes aceptados por petición | `20` |
| `BODY_LIMIT` | Tamaño máximo del cuerpo JSON | `100kb` |
| `LOG_LEVEL` | Nivel mínimo de log (`debug`, `info`, `warn`, `error`, `silent`) | `info` |
| `LOG_PRETTY` | `true` = consola legible con objetos expandidos; `false` = JSON | `true` |

- `config/env.ts` valida la presencia y formato al arrancar; si falta una clave de un proveedor habilitado, el servidor arranca pero ese proveedor queda deshabilitado y se registra en log.
- Se proveerá `.env.example` versionado (sin valores reales). El `.env` real nunca se commitea.

### 9.1 Trazabilidad del sistema experto (logs)

- Cada `POST /api/chat` genera un `requestId` (8 chars) que correlaciona todas las líneas de la petición (`middlewares/request-logger.ts`).
- El SE registra por consulta (`modules/expert-system/traza.ts`): pregunta completa, intención + datos, resolución de pregunta guiada si aplica, chequeo de cada regla (`matched`), regla disparada, hechos usados con cita y respuesta completa.
- En consola se vuelca siempre: línea resumen en español + bloque `flujo SE` como JSON con formato (objetos expandidos vía `pino-pretty`).
- En tests el logger está silenciado (`VITEST=true` → nivel `silent`).

---

## 10. Calidad y Tests Mínimos (Vitest)

1. **Linter (ESLint):** configuración base del proyecto para prevenir errores comunes.
2. **Tests mínimos con Vitest**, sin sobrecarga: se priorizan el motor de inferencia (reglas y conclusiones), los esquemas `zod` (casos válidos/inválidos), la validación de la base de conocimientos al arrancar y los adaptadores LLM con respuestas simuladas (sin llamadas reales).
3. Cada regla nueva o modificada se acompaña de su caso de prueba.

---

## 11. Criterios de Aceptación

1. La fase 1 opera sin ninguna llamada a proveedores LLM.
2. `POST /api/chat` responde el envelope documentado para consultas conocidas, ambiguas, fuera de dominio y con datos faltantes.
3. `POST /api/chat/stream` emite fragmentos y un `resultado` que respeta las mismas reglas que el modo clásico.
4. `GET /api/llm/providers` refleja exactamente la configuración habilitada.
5. Una selección de proveedor/modelo no habilitada es rechazada con `400`.
6. El fallo de un proveedor devuelve error tipificado sin exponer detalles internos.
7. Agregar un proveedor no requiere modificar el sistema experto ni el contrato.
8. Existen tests mínimos que demuestran el cumplimiento de las reglas.
9. Ninguna clave ni secreto aparece en el repositorio ni en las respuestas.

---

## 12. Fuera del Alcance Inicial

- Persistencia en base de datos (el backend es stateless; ver especificación del proyecto §8.5).
- Autenticación, roles y cuotas por usuario.
- Rate limiting por IP (se evaluará ante abuso; ver §8.2).
- Panel administrativo para editar conocimientos o reglas.
- RAG avanzado, fine-tuning o agentes con herramientas externas.
