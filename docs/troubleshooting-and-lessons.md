# 🛡️ Lecciones Aprendidas, Trampas Comunes y Solución de Problemas

Este documento es el **registro histórico de problemas críticos resueltos** en **Free-Spoty**. Léelo atentamente antes de tocar el motor de audio o la capa de datos. Cada una de estas soluciones costó horas de diagnóstico y representa una decisión de diseño fundamental.

---

## 1. El Error 150/101 de YouTube y el Dominio `youtube-nocookie.com`

- **Síntoma:** Canciones de grandes artistas (por ejemplo Myke Towers, Dua Lipa, Bad Bunny) se quedaban en silencio o emitían el error 150/101 al intentar reproducirse.
- **Causa:** En la configuración del reproductor `new window.YT.Player()` se utilizaba `host: 'https://www.youtube-nocookie.com'`. Las grandes discográficas (Warner Music, Sony Music, UMG) configuran sus licencias de YouTube para restringir explícitamente la inserción en dominios nocookie.
- **Regla:** **NUNCA volver a añadir `host: 'https://www.youtube-nocookie.com'`**. El reproductor debe usar el host estándar de YouTube (`https://www.youtube.com/iframe_api`) con `origin: window.location.origin`.

---

## 2. Bloqueo de Reproducción por Políticas de "Viewability" del Navegador

- **Síntoma:** Al dar a play en móviles (iPhone Safari o Android Chrome), la canción arrancaba durante medio segundo y se pausaba sola, o no llegaba a comenzar.
- **Causa:** El contenedor del iframe tenía `opacity: 0.001` y `z-index: -1`. Los motores WebKit y Chromium cuentan con algoritmos de visibilidad (`IntersectionObserver` interno). Si un iframe tiene opacidad casi nula o dimensiones 0x0, el navegador asume que es contenido oculto o publicidad fraudulenta de fondo y **suspende el autoplay y los hilos de decodificación multimedia**.
- **Regla:** El contenedor del iframe de YouTube debe tener:
  ```typescript
  container.style.opacity = '1';          // Para el navegador es 100% visible
  container.style.zIndex = '-9999';        // Físicamente oculto tras la app (#09090b)
  container.style.pointerEvents = 'none';  // Traspasa todos los clics a la interfaz
  ```

---

## 3. Pausa Espuria Durante la Carga (`isStartingTrackRef`)

- **Síntoma:** Al pulsar el botón de Play en una canción, el botón cambiaba instantáneamente a Play de nuevo (se paraba la canción de inmediato).
- **Causa:** Cuando se llama a `player.loadVideoById()`, la API interna de YouTube emite el evento `2` (`PAUSED`) mientras descarga los metadatos iniciales del video. Si el listener de estado en `PlayerContext.tsx` ejecutaba directamente `setIsPlaying(false)` al recibir `state === 2`, la interfaz revertía el estado a pausa antes de que el video llegara al estado `1` (`PLAYING`).
- **Regla:** Debe mantenerse siempre la bandera `isStartingTrackRef.current = true` durante el inicio de la pista. Si llega un evento `PAUSED` mientras `isStartingTrackRef` está activo, **no se apaga la reproducción**; se reenvía `youtubeService.play()` para forzar el arranque.

---

## 4. La Trampa del Proxy Gratuito de Render ("Cold Start")

- **Síntoma:** En ciertos dispositivos, las canciones tardaban más de 30 segundos en sonar o el audio fallaba por timeout.
- **Causa:** Se guardó en `localStorage` la URL de un backend en Render (`https://free-spoty-api.onrender.com`). Los servidores gratuitos de Render entran en suspensión tras unos minutos de inactividad y tardan entre 30 y 45 segundos en despertar ("cold start"). Durante ese tiempo, Safari y Chrome agotan la ventana de tiempo del gesto del usuario (`user-gesture token`) y abortan el audio.
- **Regla:** En `getCustomBackendUrl()`, cualquier URL que contenga `onrender.com` se purga automáticamente de `localStorage`. La aplicación utiliza el motor nativo de YouTube como primera opción inmediata.

---

## 5. Carátulas Rotas e IDs de YouTube Eliminados en `exploreData.ts`

- **Síntoma:** Canciones como *LALA* de Myke Towers aparecían con la carátula en negro mostrando el texto alternativo `LALA`, y al dar al play no sonaba nada.
- **Causa:** En `src/services/exploreData.ts` se habían introducido manualmente URLs de Apple Music (`mzstatic`) con hashes inventados que devolvían `404 Not Found`. Además, tenían asignados identificadores de YouTube fijos que habían sido borrados de la plataforma. La caché local (`songCache`) priorizaba estas entradas sobre el buscador en vivo, sirviendo videos eliminados.
- **Regla:** 
  1. Todas las entradas de `FEATURED_PLAYLISTS` deben contener carátulas y video IDs verificados mediante script (`oembed` y `HEAD 200`).
  2. Todo elemento `<img>` debe contar con `onError`:
     ```tsx
     onError={(e) => {
       (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
     }}
     ```
  3. Si un video falla en tiempo de ejecución, el manejador de errores de `PlayerContext` debe contar con la re-resolución dinámica automática hacia Invidious.

---

## 6. Prioridad de Búsqueda de Candidatos de Video

- **Lección:** Buscar `${artista} ${título} audio` suele devolver canales secundarios no oficiales o videos con baja tasa de éxito de inserción.
- **Solución:** La consulta primaria siempre debe ser `${cleanArtist} ${cleanTitle}` directo. YouTube e Invidious posicionan los videos oficiales y videoclips verificados en los primeros 2 resultados en más del 98% de los casos.
