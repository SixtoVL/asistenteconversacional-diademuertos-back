# Asistente Conversacional — Día de Muertos

Asistente conversacional sobre las tradiciones del Día de Muertos, construido con un **sistema experto basado en reglas de producción**. Se divide en dos repositorios independientes:

- **Frontend** (React + TypeScript + Vite): https://github.com/SixtoVL/asistenteconversacional-diademuertos-ui
- **Backend** (Node.js + Express + TypeScript): https://github.com/SixtoVL/asistenteconversacional-diademuertos-back

Esta guía está redactada **para Windows**, paso a paso y sin conocimientos previos.

---

## Requisitos previos (Windows)

Comprueba que tienes estas dos cosas instaladas.

### 1. Node.js

1. Presiona la tecla **Inicio**, escribe `cmd` y presiona Enter (se abre una ventana negra).
2. Escribe `node --version` y presiona Enter.
3. Debe aparecer algo como `v22.17.0` (cualquier versión **v20 o mayor** sirve).
4. Si te dice *"no se reconoce 'node' como un comando"*: ve a https://nodejs.org, descarga la versión **LTS** e instálala dándole a "Siguiente" todo el rato. Después **cierra y vuelve a abrir** la terminal y repite el punto 2.

### 2. Git

1. En la misma ventana escribe `git --version` y presiona Enter.
2. Debe aparecer `git version 2.x.x`.
3. Si no lo tienes tienes dos opciones:
   - **Opción A (instalar Git):** ve a https://git-scm.com/download/win, descárgalo e instálalo dándole Enter a todo por defecto.
   - **Opción B (sin instalar nada):** entra al enlace del repositorio que quieras (los dos están arriba), presiona el botón verde **<> Code** → **Download ZIP**, y extrae el ZIP con click derecho → **Extraer todo**. Después salta al paso indicado al final de cada sección.

---

## Paso 0 — Crea la carpeta de trabajo

1. Ve a tu **Escritorio**.
2. Haz click derecho en un lugar vacío → **Nueva** → **Carpeta**.
3. Nómbrala `AsistenteConversacional` (sin espacios) y presiona Enter.
4. Entra a esa carpeta con doble click.
5. Haz click en la **barra de direcciones** de arriba (donde se ve la ruta `Escritorio\AsistenteConversacional`), escribe encima `cmd` y presiona Enter.
6. Se abrirá una ventana negra: esa será tu **terminal 1**. Mientras trabajes, la terminal 1 debe permanecer **abierta**.

---

## Paso 1 — Arranca el backend (terminal 1)

En la terminal 1 escribe cada línea y presiona Enter, esperando a que termine la anterior:

```bash
git clone https://github.com/SixtoVL/asistenteconversacional-diademuertos-back.git
cd asistenteconversacional-diademuertos-back
npm install
npm run dev
```

Qué pasa en cada paso:

- `git clone ...` descarga el código (verás `Cloning into ...`).
- `npm install` descarga las dependencias: **tarda un par de minutos y es normal que no escriba nada de nuevo**; no cierres la ventana.
- `npm run dev` arranca el servidor. Al final debe verse: **`Servidor corriendo en puerto 3000`**.

**Comprobación:** sin cerrar nada, abre el navegador en <http://localhost:3000/health>. Debe aparecer `{"status":"ok"}`.

> **Si usaste la Opción B (ZIP):** extrae el ZIP de la carpeta de trabajo, entra a la carpeta extraída con `cmd` desde la barra de direcciones y ejecuta directamente `npm install` y `npm run dev`.

**Deja esta terminal abierta.** Ya no se vuelve a tocar.

---

## Paso 2 — Arranca el frontend (terminal 2)

Necesitas una segunda terminal en la misma carpeta. Hazlo de cualquiera de estas dos formas:

- **Forma A:** en la terminal 1 escribe `start cmd` y presiona Enter → se abre una ventana nueva que arranca en la misma carpeta.
- **Forma B:** repite el truco del Paso 0: dentro de la carpeta `AsistenteConversacional`, click en la barra de direcciones → escribe `cmd` → Enter.

Esa nueva ventana es tu **terminal 2**. En ella escribe, línea por línea:

```bash
git clone https://github.com/SixtoVL/asistenteconversacional-diademuertos-ui.git
cd asistenteconversacional-diademuertos-ui
npm install
npm run dev
```

Al terminar debe verse algo como:

```
VITE v...  ready in ... ms
➜  Local:   http://localhost:5173/
```

> **Si usaste la Opción B (ZIP):** extrae también el ZIP del frontend, entra con `cmd` a su carpeta y ejecuta `npm install` y `npm run dev`.

Nota importante: el repositorio **ya incluye el archivo `.env`** que le dice al frontend que el backend está en el puerto 3000 (incluido a propósito para este trabajo escolar). **No tienes que copiar ni crear ningún archivo de configuración.** Si algún día cambias el puerto del backend, edita ese `.env` y vuelve a ejecutar `npm run dev` (Vite solo lo lee al arrancar).

**Deja también esta terminal abierta.**

---

## Paso 3 — Prueba el asistente

1. Con **las dos terminales abiertas**, abre el navegador en <http://localhost:5173>.
2. Verás el chat del asistente. Escribe `hola` y presiona Enter.
3. Debe responder con un saludo. Prueba también, por ejemplo: `¿qué significa la flor de cempasúchil?`.

Resumen del funcionamiento:

- **Terminal 1** = backend (el cerebro).
- **Terminal 2** = frontend (la página).
- **Navegar a otra pestaña/cerrar una terminal** = esa parte se apaga y hay que volver a ejecutar su `npm run dev`.

---

## Si algo falla

Revisa en este orden:

1. **El chat no conecta / dice que no encuentra el servidor** → la terminal 1 se cerró o falló. Comprueba que sigue abierta y que dice `Servidor corriendo en puerto 3000`; comprueba también <http://localhost:3000/health> en el navegador.
2. **`http://localhost:5173` no abre o sale en blanco** → la terminal 2 se cerró. Vuelve a ejecutar `npm run dev` en la carpeta del frontend.
3. **`npm` no se reconoce** → cierra todas las terminales, instala Node.js (punto 1 de Requisitos) y vuelve a empezar el paso donde falló.
4. **Apareció un error en rojo en una terminal** → copia el texto del error tal cual, es lo primero que hay que ver.

---

## Comandos útiles

**Backend**

| Comando          | Qué hace                                             |
| ---------------- | ---------------------------------------------------- |
| `npm run dev`    | desarrollo con recarga automática (`tsx watch`)      |
| `npm run build`  | compila a `dist` y copia la base de conocimiento     |
| `npm start`      | arranca la versión compilada (requiere build previo) |
| `npm test`       | corre las pruebas (Vitest)                           |
| `npm run lint`   | revisa el código (ESLint)                            |

**Frontend**

| Comando            | Qué hace                             |
| ------------------ | ------------------------------------ |
| `npm run dev`      | desarrollo con recarga (HMR)         |
| `npm run build`    | typecheck + build de producción      |
| `npm run lint`     | revisa el código (ESLint)            |
| `npm run preview`  | previsualiza el build de producción  |
