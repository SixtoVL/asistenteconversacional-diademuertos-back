# Notas de Investigación — Base de Conocimientos

## 2026-10-13 — Corpus inicial

- Se incorporan 8 documentos (F01–F08), el mínimo del objetivo MVP (8–15 según spec §4.3).
- Cobertura temática: historia (F01, F02), ofrendas y elementos (F03, F04), variaciones regionales (F04, F05, F06), tradiciones y contexto (F07, F08).
- `ofrendas-barro-pan-recuerdo.pdf` (F03) fue retirado temporalmente por codificación de texto rota y reincorporado con OCR rehecho (~36 MB; corpus total ~41 MB). El texto nuevo se verificó legible, con artefactos típicos a limpiar en extracción (guiones de fin de línea, `￾` sueltos).
- El PDF de 36 MB se dividió después en 5 partes (`ofrendas-barro-pan-recuerdo-1-5.pdf`, `-6-10.pdf`, `-11-15.pdf`, `-16-20.pdf`, `-21-24.pdf`; 6-8 MB c/u) porque el tamaño original rompía el parseo externo; registradas como F03a–F03e. Los folios impresos se conservan en cada parte, así que las citas de páginas de los hechos no cambiaron (solo el `fuenteId`).
- Metadatos de autor/institución/año completados para las 8 fuentes (F01, F02, F05, F08 aportados por investigación propia; F03, F04, F06, F07 extraídos de los PDF). Faltan: licencias de uso y título de revista de F06.
- Los nombres originales tenían espacios, mayúsculas mixtas y caracteres con encoding dañado (`cempax�chitl`, `redistribuci�n`); se normalizaron a ASCII. Títulos originales conservados en `bibliografia.md`.

## Pendiente de verificar

- [x] Completar autor/institución y año de cada fuente en `bibliografia.md` (hecho 2026-10-13).
- [ ] Completar licencias de uso y título de revista de F06.
- [ ] Confirmar que cada PDF tiene texto seleccionable (§6.1) o identificar cuáles necesitan OCR (§6.2).
- [ ] Confirmar que la licencia de cada documento permite archivarlo en el repo; si alguno no lo permite, retirarlo de `fuentes/` y dejar solo el registro bibliográfico con URL y fecha de consulta.
- [ ] Extraer hechos por categoría y registrar páginas de respaldo antes de estructurar `hechos.json` (spec §5, pasos 5–10).

## Criterios activos (resumen del spec)

- Priorizar INAH, UNESCO, Secretaría de Cultura, publicaciones académicas y etnografías.
- No usar como único respaldo de conocimientos importantes a fuentes que no permitan verificar la afirmación.
- No generalizar prácticas regionales como si fueran nacionales.
- Registrar interpretaciones divergentes con su contexto en lugar de elegir una versión arbitraria.
