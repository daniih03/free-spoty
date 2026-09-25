# 🛡️ Lecciones Aprendidas, Trampas Comunes y Solución de Problemas

Este documento es el **registro histórico de problemas críticos resueltos** en **Free-Spoty**. Léelo atentamente antes de tocar el motor de audio o la capa de datos. Cada una de estas soluciones costó horas de diagnóstico y representa una decisión de diseño fundamental.

---

## 1. El Error 150/101 de YouTube y el Dominio `youtube-nocookie.com`

- **Síntoma:** Canciones de grandes artistas (por ejemplo Myke Towers, Dua Lipa, Bad Bunny) se quedaban en silencio o emitían el error 150/101 al intentar reproducirse.
- **Causa:** En la configuración del reproductor `new window.YT.Player()` se utilizaba `host: 'https://www.youtube-nocookie.com'`. Las grandes discográficas (Warner Music, Sony Music, UMG) configuran sus licencias de YouTube para restringir explícitamente la inserción en dominios nocookie.
- **Regla original:** no usar `host: 'https://www.youtube-nocookie.com'`; usar el host estándar con `origin: window.location.origin`.
- **⚠️ Estado actual:** el commit `9fca205` volvió a activar `youtube-nocookie.com` para reducir anuncios en móvil. La recuperación automática (candidatos Topic/lyrics + re-resolución, ver `audio-engine.md`) mitiga los errores 150. Si reaparecen fallos masivos en artistas de grandes discográficas, esta es la primera sospecha.

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
  3. Si un video falla en tiempo de ejecución, `handleEngineError` (`state/player.ts`) prueba candidatos y re-resuelve en vivo. Usar `<Cover>` (`UI/Primitives.tsx`) o `onImageError` (`lib/images.ts`) garantiza el fallback.

---

## 6. Prioridad de Búsqueda de Candidatos de Video

- **Lección:** Buscar `${artista} ${título} audio` suele devolver canales secundarios no oficiales o videos con baja tasa de éxito de inserción.
- **Solución histórica:** la consulta primaria era `${cleanArtist} ${cleanTitle}` directo.
- **Estado actual (v2):** ambas consultas se lanzan en paralelo; `audio` se prioriza (sin intros ni pre-roll, commit `9fca205`) y la directa aporta respaldos. El **ranking por duración** frente a la duración oficial de iTunes descarta canales secundarios, "Extended Edit" o bucles, que era el problema original de la consulta `audio`.

---

## 7. Instancias públicas sin CORS (Piped / Invidious)

- **Síntoma:** búsquedas de vídeo que tardaban o fallaban sin motivo aparente.
- **Causa:** `yewtu.be` e `invidious.nerdvpn.de` responden a `curl` pero **no envían `Access-Control-Allow-Origin`**: desde el navegador fallan siempre. Varias instancias Piped históricas (`pipedapi.kavin.rocks`) devuelven 502.
- **Regla:** antes de añadir una instancia, verificar CORS desde un origen real:
  ```bash
  curl -s -o /dev/null -D - -H "Origin: https://daniih03.github.io" "https://INSTANCIA/search?q=test&filter=videos" | grep -i access-control
  ```
  Verificadas (sept. 2026): `api.piped.private.coffee`, `pipedapi.ducks.party`, `invidious.f5.si` (esta última intermitente).

---

## 8. Deezer no admite CORS → JSONP, y perfiles impostores

- **Síntoma:** el retrato 1000x1000 de Deezer y el número de fans nunca aparecían; siempre se usaba la carátula de iTunes.
- **Causa:** `api.deezer.com` no envía cabeceras CORS; el `fetch` fallaba en silencio.
- **Solución:** `fetchJsonp()` (`lib/net.ts`) con `output=jsonp&callback=…`.
- **Trampa adicional:** buscar "Bad Bunny" con `limit=1` devolvía una fan-page con 7 fans. Se piden 10 resultados y se elige la coincidencia exacta de nombre con más fans.

---

## 9. `transform` de animaciones vs. `translate` de Tailwind

- **Síntoma:** la cápsula flotante de escritorio aparecía desplazada a la derecha.
- **Causa:** `-translate-x-1/2` y la animación `fadeIn` (`transform: scale()`) compiten por la misma propiedad `transform`; con `animation-fill-mode` la animación gana y se pierde el centrado.
- **Regla:** nunca combinar `animate-*` que use `transform` con `translate-*`/`scale-*` en el **mismo** elemento. Animar un hijo interno o centrar con flex (`inset-x-0 flex justify-center`).

---

## 10. Las canciones destacadas sobrescriben la caché de resolución

- `getResolveCache()` carga la caché persistente y después impone los IDs verificados de `exploreData.ts`. Es intencionado (los IDs destacados están verificados), pero hay que tenerlo en cuenta al depurar: para probar la recuperación ante errores, usar una canción **no destacada**.

---

## 11. Supabase: no llamar al cliente dentro de `onAuthStateChange`

- Hacer `await supabase.from(...)` dentro del callback de `onAuthStateChange` puede bloquear el cliente (bloqueo interno del SDK). `AuthContext` difiere esas llamadas con `setTimeout(…, 0)` y sincroniza una sola vez por usuario (antes se sincronizaba dos veces: en `getSession` y en el evento inicial).
- Los `song_id` de la nube son IDs internos (`itunes_…`), **no** IDs de YouTube: al leer de Supabase, `youtubeId` debe ser `''` para que el resolver actúe (antes se asignaba `song_id` y provocaba un error de YouTube en cada reproducción desde favoritos).

---

## 12. Seguridad del backend: nunca interpolar en una shell

- `server/index.js` construía `` exec(`yt-dlp … "https://www.youtube.com/watch?v=${videoId}"`) `` con el `id` de la query sin validar: **inyección de comandos** (y `/api/debug` igual).
- **Regla:** `execFile`/`spawn` con argumentos en array, `--` antes de la URL y validación `/^[\w-]{11}$/`. El endpoint de depuración se eliminó.
