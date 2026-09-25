# CLAUDE.md — Platino

Contexto para Claude Code en este repo. Documentación completa en `docs/` (léela antes de tocar audio/datos): `README.md`, `architecture.md`, `audio-engine.md`, `features.md`, `deployment-and-ops.md`, `troubleshooting-and-lessons.md`.

## Responder en castellano y en el menor número de líneas posible.

## Resumen
Web tipo Spotify Premium gratis: React 18 + TypeScript + Tailwind + Vite. Stores propios (`useSyncExternalStore`, sin libs externas). Supabase (Auth+Postgres RLS) bajo demanda. Metadatos: iTunes Search + Deezer (JSONP). Audio: YouTube IFrame API o `<audio>` nativo vía servidor propio (`server/`, yt-dlp) con resolver multi-candidato y caché. Letras: LRCLIB. Deploy: GitHub Pages (`main`) vía Actions → `https://daniih03.github.io/platino/`.

## Reglas de oro
1. Todo cambio debe compilar (`npm run build`) y desplegarse a `main`. `version.json` se genera solo.
2. Cero silencios / cero bloqueos: reproducir con 1 toque, nunca cortar por `PAUSED` espurio.
3. Carátulas siempre con `<Cover>` o `onImageError` (`lib/images.ts`) + `artwork(url, size)`.
4. Motor YouTube Iframe directo por defecto (nada de proxies con cold start); iframe con `opacity:1; z-index:-9999; pointer-events:none` (nunca oculto por opacidad/tamaño 0, rompe autoplay).
5. Estado global en stores con selectores (`lib/store.ts`). Nunca leer `currentTime` fuera de `useCurrentTime()`; selectores nunca devuelven objetos nuevos.
6. Cada cambio de diseño/arquitectura/función: actualizar `docs/` obligatoriamente.

## Arquitectura (`architecture.md`)
- `src/App.tsx`: shell con rutas por hash, vistas lazy, overlays montados solo al abrir.
- `state/player.ts` (playerStore+progressStore), `state/ui.ts`, `services/storageService.ts` (libraryStore), `context/AuthContext.tsx`.
- Servicios: `youtube.ts` (motor), `searchService.ts` (resolver), `artistService.ts`, `lyricsService.ts`, `cloudStorageService.ts`.
- Stores con `useSyncExternalStore`: cada componente se re-renderiza solo si su selector cambia (evita que el tick del reproductor, 4/s, re-renderice toda la app).
- Rutas hash: `#/`, `#/search/<q>`, `#/library`, `#/liked`, `#/history`, `#/playlist/<id>`, `#/artist/<nombre>`; compatibles con botón atrás nativo.
- Code splitting agresivo, Supabase cargado bajo demanda, imágenes al tamaño real, `content-visibility: auto`.

## Motor de audio (`audio-engine.md`)
- Ciclo: `playSong` → `unlockAudio()` síncrono → token anti-carreras (`playToken`) → caché o `resolveSongWithVersions` → `loadVideo` → protección `isStarting` contra `PAUSED` espurio → prefetch de la siguiente.
- Resolver (`searchService.ts`): caché persistente 7 días/400 entradas → dedupe → consultas paralelas `"artista título audio"` + `"artista título"` → fuentes por orden (servidor propio, YouTube Data API si hay key, `raceFirst` entre Piped/Invidious con CORS verificado) → ranking por duración vs iTunes → precarga de la siguiente.
- Recuperación ante error (100/101/150): marca fallo → siguiente candidato → re-resolución en vivo (1 vez) → salta tras 1,2s (máx. 3 fallos seguidos).
- Watchdog a 3s si sigue `BUFFERING/UNSTARTED/PAUSED`.
- Modo 0 anuncios: servidor propio + `<audio>` nativo, iframe de YouTube ni se carga; fallback a YouTube si el servidor cae (configurable), re-chequeo `/health` cada 30s.
- EQ real (Web Audio) solo con servidor propio. Sesión persistente cada 5s en `free_spoty_session`.
- Host `youtube-nocookie.com` activo (reduce anuncios móvil); si vuelven errores 150 masivos, revisar esta decisión primero.

## Funcionalidades (`features.md`)
Buscador con Studio Stage/Spotlight, perfil de artista+discografía (Deezer JSONP para fans/foto), letras sincronizadas con scroll inteligente, cápsula flotante + Zen Sheet móvil, True Shuffle (Fisher-Yates), Sleep Timer con fade, MediaSession API, favoritos/playlists/artistas seguidos, sync Supabase con RLS y migración de invitado, EQ real, reanudar sesión, rutas enlazables. Identidad visual v3 "Laca hi-fi" (sept. 2026): paleta `ink/lacquer/raised/paper/mute/brand.red #C81900/brand.coral/brass`, tipografía Bricolage Grotesque + Geist, elemento firma "el vinilo real" (disco que sale de la funda y gira al sonar).

## Deploy y operaciones (`deployment-and-ops.md`)
- CI/CD: push a `main` → GitHub Actions (Node 20, `npm run build`) → GitHub Pages, ~35-45s.
- Hot-update: `vite.config.ts` genera `BUILD_VERSION`/`version.json` en build; `useVersionCheck.ts` detecta cada 60s y aplica recarga sin cortar música (al pausar/fin de cola).
- Checklist deploy: `npm run build` → probar con `vite preview` → actualizar `docs/` → commit+push a `main` → verificar `version.json` en producción.
- Servidor de audio 0 anuncios (`server/`): setup único `server\setup-windows.ps1` (Tailscale + Funnel HTTPS fija, tarea programada con autocuración). Arranque manual: `server\start-windows.ps1 [-Tunnel]`. Verificar destacadas: `node server/scripts/verify-featured.js [--write]`.

## Lecciones críticas (`troubleshooting-and-lessons.md` — leer antes de tocar audio/datos)
1. `youtube-nocookie.com` puede bloquear grandes discográficas (error 150); mitigado con recuperación automática.
2. Iframe con opacidad/tamaño ~0 dispara bloqueo de autoplay por "viewability" del navegador.
3. `PAUSED` espurio al cargar: no apagar reproducción si `isStartingTrackRef` está activo.
4. Nunca usar proxies con cold start (ej. `onrender.com`, se purgan automáticamente de `localStorage`).
5. Carátulas/IDs de `exploreData.ts` deben verificarse (oEmbed + HEAD 200); siempre `onError` en `<img>`.
6. Consultas de resolución en paralelo (`audio` + directa) con ranking por duración vs iTunes.
7. Verificar CORS real antes de añadir instancias Piped/Invidious.
8. Deezer sin CORS → JSONP; evitar perfiles impostores pidiendo 10 resultados y eligiendo coincidencia exacta con más fans.
9. Nunca combinar `animate-*` (usa `transform`) con `translate-*`/`scale-*` en el mismo elemento.
10. Las destacadas de `exploreData.ts` sobrescriben la caché de resolución (para probar recuperación de errores, usar canción no destacada).
11. Nunca llamar al cliente Supabase dentro de `onAuthStateChange` sin diferir (`setTimeout(…,0)`); `song_id` de la nube no es ID de YouTube.
12. Backend: nunca interpolar en shell (`execFile`/`spawn` con array + validación de ID `/^[\w-]{11}$/`).
13. "0 anuncios" sin servidor propio no es viable (Piped/Invidious bloqueados por YouTube/anti-bots).
14. yt-dlp en Windows: usar worker Python persistente y `--js-runtimes node`.
15. Tras tocar `exploreData.ts`, ejecutar siempre `verify-featured.js`.
16. PowerShell 5.1: usar `Invoke-Native` (`Continue` + check `$LASTEXITCODE`) para evitar abortos por stderr de ejecutables.
17. Local Network Access: `tailscale set --accept-dns=false` para que `*.ts.net` resuelva a IP pública (Funnel) desde la web publicada.
18. Al cambiar de canción, silenciar (no pausar) el motor anterior hasta que cargue la nueva.
19. Tarea programada de Windows: usar `conhost.exe --headless` + disparador cada 5 min para autocuración (evita 0xC000013A por cierre de consola).
