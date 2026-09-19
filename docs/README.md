# 🧠 Free-Spoty — Segundo Cerebro & Documentación de Contexto

Bienvenido al sistema de documentación y memoria viva de **Free-Spoty**. Esta carpeta `docs/` sirve como **Segundo Cerebro** del proyecto, diseñado para que cualquier desarrollador o asistente de IA comprenda de inmediato la arquitectura, el contexto histórico, las decisiones de diseño, los algoritmos de resolución y las lecciones aprendidas durante el desarrollo.

---

## 🗺️ Mapa de Navegación

| Documento | Descripción |
| :--- | :--- |
| 🏗️ [**`architecture.md`**](./architecture.md) | Visión global de la arquitectura, árbol de componentes React, gestión de estado con Context API y flujo de datos. |
| 🔊 [**`audio-engine.md`**](./audio-engine.md) | El motor de audio: integración con la API de YouTube Iframe, resolución dinámica de video IDs con Invidious/Piped, sistema de multi-candidatos y recuperación ante fallos. |
| 📱 [**`features.md`**](./features.md) | Catálogo completo de funcionalidades: buscador inteligente, perfil del artista, discografía, letras sincronizadas, MediaSession API, True Shuffle y cola de reproducción. |
| 🚀 [**`deployment-and-ops.md`**](./deployment-and-ops.md) | Pipeline de CI/CD con GitHub Actions, despliegue en GitHub Pages, sistema de control de versiones en caliente (`version.json`) y cache-busting. |
| 🛡️ [**`troubleshooting-and-lessons.md`**](./troubleshooting-and-lessons.md) | **Lectura obligatoria antes de modificar el reproductor**: registro detallado de los problemas críticos resueltos (Error 150 de YouTube, bloqueo de autoplay por opacidad, IDs obsoletos, proxies lentos y políticas de navegador). |

---

## 📌 Resumen Ejecutivo del Proyecto

- **Propósito:** Proporcionar una experiencia web idéntica a Spotify Premium (interfaz, velocidad, letras en tiempo real, perfiles de artistas y discografías completas) pero completamente gratuita, libre de anuncios molestos y accesible desde cualquier navegador (escritorio y móvil).
- **Stack Tecnológico:**
  - **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
  - **Fuente de Metadatos:** iTunes Search API (rápida, sin CORS, carátulas 600x600) y Deezer API (imágenes 1000x1000 y conteo de fans).
  - **Fuente de Audio:** Motor híbrido basado en la YouTube Iframe Player API con fallback automático a proxies de audio nativo (`<audio>`), orquestado por un resolver dinámico de instancias Invidious.
  - **Letras Sincronizadas:** LRCLIB API con interpolación milimétrica en vivo.
  - **Despliegue:** GitHub Pages con GitHub Actions (`main` branch) en `https://daniih03.github.io/free-spoty/`.

---

## ⚡ Reglas de Oro para el Desarrollo

1. **Auto-Despliegue Continuo:** Cualquier cambio debe compilar limpiamente (`npm run build`), actualizar la marca de tiempo en `public/version.json`, y publicarse a `origin main` de forma automatizada.
2. **Cero Silencios / Cero Bloqueos:** La reproducción musical debe arrancar con **1 solo toque**. Nunca debe detenerse por eventos transitorios de búfer (`PAUSED` espurio).
3. **Imágenes Blindadas:** Todo componente que renderice carátulas (`<img>`) debe incluir manejador `onError` con fallback visual para evitar marcos negros o textos alternativos rotos.
4. **Prioridad al Motor Nativo de YouTube:** No depender de servidores proxy de pago o instancias gratuitas de Render con "cold start" de 30+ segundos. El motor YouTube Iframe directo es instantáneo y universal si se respetan las directivas de visibilidad (`opacity: 1`, `z-index: -9999`).
5. **Actualización Obligatoria del Segundo Cerebro (`docs/`):** Con **cada iteración**, cambio de diseño, refactorización o nueva funcionalidad implementada, es **estrictamente obligatorio actualizar y sincronizar la documentación en `docs/`**. El contexto vivo del proyecto debe mantenerse al 100% para que cualquier asistente de IA o desarrollador pueda continuar el trabajo sin pérdida de información ni dependencias en el historial del chat.
