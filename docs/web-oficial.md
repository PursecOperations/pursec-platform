# Web oficial de PURSEC (versión v4)

**Estado:** versión oficial y definitiva de momento. **No publicada** en pursec.club.

- Rama: `claude/rediseno-f1` · PR #16 (abierto, sin fusionar).
- Versión fijada: el último commit de la rama `claude/rediseno-f1` a 6 oct 2026 (las etiquetas de git no se pueden subir desde este entorno).
- Vista previa: https://claude-rediseno-f1-pursec-platform.pursec-telemetry-hq.workers.dev

## Qué es

Portada tipo portal de carreras con estas características:
- Colores: negro grafito y el lila del logo largo de chicle.
- Tipografía: Saira Expanded en titulares y Saira en el texto.
- Fondo con movimiento suave y esquinas redondeadas en todo.
- Cobertura: las 9 series (F1, F2, F3, FE, MotoGP, IndyCar, WEC, IMSA, GT3).
- Datos reales con fuente de F1 y MotoGP, y calendarios reales de todas las series.
- Imágenes: fotos y logos de 2026 de Wikimedia Commons (créditos en `/creditos`).
- Archivos principales: `public/css/v4.css`, `public/js/v4-*.js` y las páginas de `public/*.html`.

## Antes de publicar (revisión del Agente 09, 6 oct 2026)

1. **Alto · Datos del titular.** Rellenar titular, NIF y domicilio en Aviso legal, Privacidad y Términos (`docs/legal/*.md`). Los da Oriol o el gestor.
2. **Alto · Google Fonts.** Alojar las fuentes en la propia web (Saira y Saira Expanded) en lugar de cargarlas desde Google.
3. **Medio · Datos de ejemplo.** Quitar los horarios de sesión inventados hasta tener los oficiales. En Brief, Race Card y Sprint Card, mostrar el ejemplo sin cifras o con un aviso claro.
4. **Medio · Vídeos.** Marcarlos como "Próximamente" y quitar las duraciones, porque los vídeos aún no existen.
5. **Medio · Emails de contacto.** Usar pursec.telemetry.hq@gmail.com mientras no funcione el reenvío de hola@ y legal@pursec.club.
6. **Medio · Renovación automática.** Decirlo claro en la tarjeta de Trackside, con enlace a la baja.
7. **Bajo · Logos.** Usarlos solo para identificar equipos, nunca como reclamo en publicidad o redes.
8. **Bajo · Créditos.** Indicar en `/creditos` que las fotos CC BY-SA están redimensionadas o recortadas.
9. **Bajo · Redes sociales.** Ocultar los enlaces hasta tener las URLs reales.

Publicar = fusionar el PR #16 en `main` (solo cuando Oriol lo diga).
