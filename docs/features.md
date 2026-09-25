# 📱 Catálogo de Funcionalidades de Free-Spoty

Este documento describe todas las características implementadas en **Free-Spoty**, su diseño inspirado en Spotify y los detalles de interacción.

---

## 🌟 Resumen de Funcionalidades

| Característica | Estado | Ubicación Principal |
| :--- | :--- | :--- |
| 🔍 **Buscador Universal con Studio Stage** | Activo | `src/components/Views/SearchView.tsx` |
| 🎤 **Perfil de Artista y Discografía** | Activo | `src/components/Views/ArtistView.tsx` (álbumes en `AlbumSheet`) |
| 📜 **Letras Sincronizadas en Vivo** | Activo | `src/components/Player/LyricsView.tsx` |
| 🎵 **Cápsula flotante + Zen Sheet móvil** | Activo | `src/components/Player/FloatingPlayer.tsx`, `ZenSheet.tsx` |
| 🔀 **True Shuffle (Fisher-Yates)** | Activo | `src/state/player.ts` |
| ⏱️ **Sleep Timer (incl. fin de canción)** | Activo | `src/state/player.ts` |
| 📱 **MediaSession API (Pantalla de Bloqueo)** | Activo | `src/state/player.ts` |
| ❤️ **Favoritos, Playlists y Artistas seguidos** | Activo | `src/services/storageService.ts` |
| ☁️ **Sincronización con Supabase** | Activo | `src/services/cloudStorageService.ts` |
| 🎚️ **Ecualizador real (con servidor de audio)** | Activo | `src/services/youtube.ts`, `EqualizerModal.tsx` |
| 💾 **Reanudar sesión (canción, cola, posición)** | Activo | `src/state/player.ts` |
| 🔗 **Rutas enlazables + botón atrás del sistema** | Activo | `src/hooks/useNavigation.ts` |

--- | :--- | :--- |
| 🔍 **Buscador Universal con Spotlight** | Activo | `src/components/Views/SearchView.tsx` |
| 🎤 **Perfil de Artista y Discografía** | Activo | `src/components/Views/ArtistView.tsx` |
| 💿 **Explorador de Discos y Álbumes** | Activo | `src/components/UI/AlbumModal.tsx` |
| 📜 **Letras Sincronizadas en Vivo** | Activo | `src/components/Player/LyricsView.tsx` |
| 🎵 **Reproductor Multipantalla** | Activo | `src/components/Player/BottomPlayer.tsx` |
| 🔀 **True Shuffle (Aleatorio Real)** | Activo | `src/context/PlayerContext.tsx` |
| ⏱️ **Temporizador de Apagado (Sleep Timer)** | Activo | `src/context/PlayerContext.tsx` |
| 📱 **MediaSession API (Pantalla de Bloqueo)** | Activo | `src/context/PlayerContext.tsx` |
| ❤️ **Colección de Favoritos y Playlists** | Activo | `src/context/MusicContext.tsx` |

---

## 🔍 1. Buscador Inteligente y Tarjeta Spotlight

- **Búsqueda Instantánea:** Al escribir en la barra superior o en la vista de búsqueda, se consultan metadatos mediante la API de iTunes en tiempo real con debounce y cancelación de peticiones obsoletas (`AbortController`).
- **Tarjeta "Resultado principal" (Spotlight):**
  - Muestra el resultado más relevante con carátula en 600x600, título, nombre de artista interactivo y la etiqueta oficial `Canción`.
  - **Botón de Play Destacado Siempre Visible:** Un botón circular rojo escarlata (`#c81900` / `#e02200`) con el icono de reproducción/pausa en blanco puro (`fill-white`), permanentemente visible en la esquina inferior derecha tanto en pantallas táctiles como en escritorio (sin depender de `hover`).
- **Lista Top Canciones:** Los siguientes resultados se muestran en un formato de lista compacta con carátula, número de pista, botón de me gusta y duración en formato `mm:ss`.

---

## 🎤 2. Perfil Oficial del Artista y Discografía

- **Acceso Universal:** Puedes hacer clic sobre el nombre de cualquier artista en:
  - Tarjetas de canciones (`SongCard`).
  - Resultado principal del buscador (`SearchView`).
  - Barra de reproducción inferior de escritorio (`BottomPlayer`).
  - Mini-player y reproductor expandido en móviles.
  - Pantalla completa de letras (`LyricsView`).
- **Diseño Oficial Estilo Spotify:**
  - **Hero Banner:** Fotografía del artista en 1000x1000 de Deezer (vía **JSONP**, ya que la API de Deezer no envía CORS), insignia de **Artista Verificado**, nombre en tipografía destacada, **número de fans de Deezer** y botón escarlata de reproducción total. Entre perfiles con el mismo nombre se elige la coincidencia exacta con más fans (evita fan-pages impostoras).
  - **Seguir artista:** persistente en local; los artistas seguidos aparecen en *Tu Biblioteca*.
  - **Canciones Populares:** Lista interactiva con los 10 temas más escuchados del artista, duraciones reales y botón para añadir a favoritos.
  - **Discografía Completa:**
    - Filtro por pestañas: **Todos**, **Álbumes**, y **Sencillos / EPs**.
    - Cuadrícula con carátulas en alta definición, año de lanzamiento y tipo de publicación.
- **Explorador de Álbumes (`AlbumSheet` dentro de `ArtistView.tsx`):**
  - Al pulsar sobre cualquier disco, se despliega una hoja (bottom sheet en móvil) con la lista de temas del álbum.
  - Permite reproducir canciones específicas o el álbum completo en orden.

---

## 📜 3. Letras Sincronizadas en Vivo (`LyricsView.tsx`)

- **Proveedor:** Integración con la API de LRCLIB mediante `lyricsService.ts`.
- **Sincronización:** el tick de progreso corre a 4 Hz, pero la línea activa se calcula con **búsqueda binaria** en un selector: el flujo de letras solo se re-renderiza al cambiar de verso.
- **Scroll Automático Inteligente:** la línea actual se centra dentro del contenedor (sin desplazar la página) y el auto-scroll se pausa 4 s si el usuario desplaza manualmente.
- **Letras sin sincronizar:** si LRCLIB solo tiene texto plano, se muestra como texto estático con el aviso "Letra sin sincronización disponible" (antes se inventaban marcas cada 4 s).
- **Modo Pantalla Completa:** Accesible con la tecla `F` o pulsando el icono de letras en la barra inferior. Cuenta con fondo dinámico derivado de la carátula y controles de transporte flotantes.

---

## 🎵 4. Reproductor Multipantalla Adaptativo

> Nota: la barra inferior clásica (`BottomPlayer`) fue sustituida por la cápsula flotante (ver sección 9). Esta sección se conserva como referencia histórica.

- **Desktop View (`md:flex`):**
  - Barra inferior fija de altura 96px (`h-24`) con desenfoque de fondo (`backdrop-blur-2xl`).
  - Zona izquierda: carátula interactiva con botón de maximizar letras, título y artista clicable, botón de Me Gusta.
  - Zona central: botones de control (Shuffle, Anterior, Play/Pause verde, Siguiente, Repetir), barra de progreso (scrubber) con hover verde y tiempos.
  - Zona derecha: botón de vista de letras, cola de reproducción y control de volumen con soporte de silenciado.
- **Mobile Mini Player:**
  - Barra compacta fija sobre la navegación inferior con carátula, título y controles esenciales (Like, Play/Pause).
- **Mobile Fullscreen Player Sheet:**
  - Al pulsar sobre el mini-player, se desliza hacia arriba una hoja a pantalla completa con carátula gigante en 300x300, barra de scrubber táctil, controles de reproducción ampliados y selector de temporizador.

---

## 🔀 5. True Shuffle (Aleatorio Real)

A diferencia de los reproductores convencionales que repiten canciones o desordenan torpemente la lista:
- `True Shuffle` mantiene la canción actual en el índice 0.
- Aplica el algoritmo **Fisher-Yates** al resto de la cola, garantizando una distribución 100% equiprobable sin repeticiones hasta agotar la lista.

---

## ⏱️ 6. Temporizador de Apagado (Sleep Timer)

- Opciones: fin de la canción actual, 15, 30, 45 y 60 minutos.
- **Desvanecimiento Suave (Smooth Fade Out):** en los últimos 10 segundos el volumen se atenúa progresivamente; tras pausar, el volumen original se restaura para la siguiente reproducción.

---

## 📱 7. MediaSession API Nativa

- Conexión con los controladores del sistema operativo (iOS Dynamic Island, pantalla de bloqueo de Android, teclas multimedia de teclados Windows/Mac).
- Metadatos sincronizados: título, artista, álbum y carátulas 192x192 y 512x512 (pedidas a ese tamaño real).
- Manejadores: `play`, `pause`, `nexttrack`, `previoustrack`, `seekto`, `seekbackward`, `seekforward`, registrados una sola vez.
- `setPositionState` periódico para el scrubber de la pantalla de bloqueo.

---

## 🎨 8. Identidad Visual y Sistema de Diseño de Marca

La interfaz está construida con una paleta cromática sofisticada basada exclusivamente en **tonos de rojo hiperprofesionales y fondos carbón mate**, sin presencia alguna de verdes. En el overhaul v2 se retiraron los últimos acentos cian/púrpura/ámbar (insignias de Inicio, True Shuffle, tarjeta "Me Gusta", portales) para unificar la identidad roja:

| Elemento / Tonalidad | Color Hexadecimal | Uso en la Aplicación |
| :--- | :--- | :--- |
| **Fondo Mate Carbón** | `#1a1a1a` | Color de superficie de cards, sidebar, navbar y fondo general de la app |
| **Garnet / Sombra Ambiental**| `#220300` | Sombras sutiles y resplandor ambiental inferior |
| **Burgundy Profundo** | `#360500` | Gradiente base de tarjetas destacadas (como Historial) y modales |
| **Velvet Wine** | `#540900` | Degradados de transición en tarjetas de género y banner de bienvenida |
| **Ruby Joya** | `#8e0f00` | Tarjetas de exploración temática (Lo-Fi) y acentos secundarios |
| **Rojo Carmesí Profundo** | `#a51500` | Barra de subrayado del logo, acentos y botones degradados |
| **Rojo Escarlata Primario** | `#c81900` | Botones de acción principales (Play Spotlight, Verified Artist, Discografía) |
| **Rojo Vibrante Hover** | `#e02200` | Efectos hover de botones interactivos y elementos activos |
| **Coral Neón Alta Claridad** | `#ff3b24` | Indicadores de estado activo (Shuffle, Repeat, Me Gusta, ecualizador animado) |
| **Blush** | `#ffa89c` | Iconos secundarios en ajustes y textos sobre tarjetas rojas |
| **Rosa Cálido** | `#ff6b57` | Subtítulos, etiquetas de fidelidad de audio y chips informativos |
| **Blanco Puro** | `#ffffff` | Iconografía dentro de botones de acción, glifos del logo y tipografía titular |

---

## 🔮 9. Rediseño Minimalista Studio (Aura UI vs Spotify)

Para alejarse de la saturada y rígida interfaz tradicional de Spotify, Free-Spoty implementa una arquitectura visual **espaciosa, ergonómica y futurista**:

1. **SmartDock Flotante (`SmartDock.tsx`):**
   - Sustituye a la columna lateral fija de 280px por un rail suspendido en 3D (`left-4`, `w-[68px]`).
   - Al posar el cursor, se expande suavemente a 240px con efecto blur `backdrop-blur-2xl bg-[#121217]/85` sin desplazar el contenido ni provocar saltos de diseño (cero layout shift).
   - Libera más del 90% del ancho del viewport para la música.

2. **Cápsula de Sonido Flotante de Estudio (`FloatingPlayer.tsx`):**
   - Sustituye la barra inferior fija de 96px por una consola flotante aerodinámica (`bottom-5`, `max-w-5xl`, `rounded-full`, `h-[88px]`) con doble halo de iluminación ambiental escarlata y cristal líquido `#101119/90`.
   - **Consola Central de Doble Cubierta:** Botonera superior de transporte con botón Play escarlata de 48px y scrubber de alta precisión integrado en la parte inferior flanqueado milimétricamente por los contadores de tiempo (`0:04` y `4:39`), sin cortes en el borde perimétrico ni textos apretados.
   - **Vinilo Analógico Auténtico:** Disco en rotación continua sincronizado (`animate-spin-slow`) con orificio de eje central (*spindle hole*) y doble anillo exterior.
   - **Píldora de Volumen Analógica:** Control de volumen en píldora de vidrio esmerilado permanentemente disponible y ultrasuave.
   - En móvil, cápsula flotante sobre la barra de navegación con acceso a la hoja inmersiva **Zen Listening Sheet**.

3. **Tarjetas Minimalistas Aura (`SongCard.tsx`):**
   - Bordes redondeados ultra-suaves (`rounded-2xl md:rounded-[22px]`) con vidrio esmerilado carbón.
   - Iluminación perimétrica reactiva (rim glow) al hacer hover.
   - **Indicador Soundwave Dinámico:** Cuando un tema está en reproducción activa, una insignia de ecualizador de 3 barras pulsantes escarlatas indica el estado visualmente en tiempo real.
   - Acciones integradas: Me Gusta con micro-blur, botón Play flotante, menú contextual con opciones de cola y guardado en listas.

4. **Fondo Midnight Obsidian Indigo (`AmbientBackground.tsx`):**
   - Fondo base oscuro profundo (`#090b10`) combinado con un resplandor índigo nocturno (`rgb(22, 28, 45)`).
   - Filtro anti-verdes que previene la filtración de tonalidades verdosas al procesar carátulas externas.

5. **Sonic Canvas en Búsqueda (`SearchView.tsx`):**
   - **Studio Stage Panorámico con Vinilo Circular:** Sustituye la división 5/7 de Spotify por un escenario de estudio inmersivo de ancho completo con un disco de vinilo en círculo perfecto (`rounded-full`) con orificio central y anillo exterior que gira fluidamente (`animate-spin-slow`) durante la reproducción, métricas HD Master y consola de acción directa (Play, Cola, Favorito, Perfil de Artista).
   - **Modo Galería Puro:** Se eliminó el modo Stream por solicitud de diseño para enfocar la experiencia al 100% en las tarjetas visuales minimalistas Aura (`SongCard`), ofreciendo una cuadrícula amplia, limpia y espaciosa de arte y vinilos.
   - **Portales de Frecuencia (Mood Portals):** Reemplazan las baldosas de colores de Spotify con iconos inclinados por elegantes portales ambientales de cristal obsidiana.

6. **Tracklist Orgánico en Playlists (`PlaylistView.tsx`):**
   - Eliminación total de la tabla estilo Excel con columnas frías (`#`, `TÍTULO`, `ÁLBUM`, `🕒`).
   - Reemplazado por un flujo de pistas de cristal esmerilado con soundwaves pulsantes y soporte de visualización conmutable en Stream o Galería.

7. **Visor de Estudio a Pantalla Completa & Letras Dinámicas (`LyricsView.tsx`):**
   - **Visor de Gran Formato:** Al abrir la pantalla completa (atajo `F` o clic sobre el vinilo del reproductor), se presenta un visor de consola con un vinilo analógico a gran escala (`w-96 h-96`), surcos concéntricos, orificio de eje central y giro en tiempo real, acompañado de controles completos de transporte, scrubber continuo de alta resolución y controles de volumen.
   - **Modo Dividido con Letras a la Derecha:** Con un solo clic en **"Ver Letra"**, el escenario se transforma en pantalla dividida: el visor de reproducción se sitúa a la izquierda con todos sus controles intactos, mientras que a la derecha se despliega el flujo de letras sincronizadas con scroll automático inteligente, marcado escarlata de la estrofa actual y búsqueda de compás por clic.
   - Conmutador en la cabecera para alternar entre el Visor de Estudio centrado y la vista dividida con Letra.

8. **Sistema de Usuarios y Sincronización en la Nube con Supabase:**
   - **Autenticación Gratuita y Segura:** Registro e inicio de sesión mediante correo y contraseña con Supabase Auth y PostgreSQL en la nube.
   - **Arquitectura Híbrida Cero Barreras:** Los usuarios pueden utilizar la app de forma 100% libre como invitados (`localStorage`), o iniciar sesión para sincronizar su música en cualquier teléfono, tablet o PC.
   - **Migración Automática de Invitado:** Al registrarse o iniciar sesión, cualquier canción guardada en local y playlists creadas previamente se suben automáticamente a la cuenta del usuario en Supabase sin pérdida de datos.
   - **Seguridad RLS (Row Level Security):** Cada usuario tiene acceso estricto y exclusivo a sus propios registros (`auth.uid() = user_id`).
   - **Modal de Autenticación de Cristal Obsidiana (`AuthModal.tsx`):** Interfaz inmersiva con alternador de inicio de sesión / creación de cuenta, validación en tiempo real y soporte para nombres de usuario personalizados.
   - **Acceso Rápido desde SmartDock y Barra Superior:** Avatar con iniciales, estado "Sincronizado" y botón de desconexión rápida tanto en escritorio como en móvil.

9. **Gestión Directa de Playlists y Añadido Instantáneo (`AddToPlaylistModal.tsx`):**
   - **Flujo Fluido Cero Fricción:** Si el usuario no tiene ninguna playlist creada, al pulsar en "Añadir a playlist" la aplicación le solicita inmediatamente el título y descripción opcional para crear la lista y añadir la canción de golpe en una sola acción.
   - **Disponibilidad Universal:** Acceso directo desde el menú contextual de cualquier tarjeta de canción (`SongCard`), la barra inferior del reproductor (`FloatingPlayer`), la vista dividida de visor de letras (`LyricsView`) y la tarjeta destacada de búsqueda (`SearchView`).
   - **Sincronización Automática con Supabase:** La nueva lista y las canciones añadidas se persisten de inmediato en PostgreSQL bajo la cuenta del usuario (o en almacenamiento local si es invitado), garantizando persistencia en tiempo real.

10. **Experiencia Móvil 100% Nativa, Ergonómica y Safe Area Insets:**
   - **Posicionamiento Dinámico Anti-Colisión:** La cápsula de sonido móvil (`FloatingPlayer`) calcula matemáticamente su altura con `bottom-[calc(60px+env(safe-area-inset-bottom,0px)+10px)]`, garantizando un espaciado exacto de 10px por encima de la barra de pestañas (`MobileNav`) en cualquier smartphone (con o sin barra de inicio / home indicator de iOS).
   - **Eliminación de Hover Traps en Pantallas Táctiles:** Los botones de "Me Gusta" y de menú contextual en las tarjetas de canciones (`SongCard`) son visibles de forma elegante en pantallas táctiles (`opacity-90 md:opacity-0 md:group-hover:opacity-100`) con áreas de impacto táctil de 44px, preservando el efecto hover en PC.
   - **Letras Sincronizadas a Pantalla Completa en Móvil:** En teléfonos móviles (`< lg`), el visor de letras prioriza el 85% de la altura vertical de la pantalla para el texto karaoke con desplazamiento suave y salto táctil, acompañado de una barra de control mini superior. En escritorio, se mantiene la vista dividida 50/50 con el vinilo de estudio.
   - **Modales en Formato "Bottom Sheet":** Los diálogos de añadir a playlist, login/registro y ecualizador se despliegan desde la base de la pantalla como hojas táctiles nativas (`items-end sm:items-center`, `rounded-t-3xl sm:rounded-3xl`, manija de arrastre y `max-h-[90dvh]`), evitando que el teclado virtual tape los campos de texto o los botones de acción.
   - **Viewport Dinámico `100dvh` y Safe-Areas Superiores:** Integración de `h-[100dvh]` y `pt-[env(safe-area-inset-top)]` en la cabecera, protegiendo los controles frente al notch y Dynamic Island de iPhone.

11. **Motor de Resolución de Búsqueda Ultrarrápido y Feedback Inmediato:**
   - **Feedback Visual en 0ms (`PlayerContext.tsx`):** Al hacer clic en reproducir sobre cualquier resultado del buscador, `FloatingPlayer` y la cápsula flotante se despliegan en el acto con la carátula, el título, el artista y el spinner de carga (`isLoadingSong: true`), eliminando la sensación de congelamiento o falta de respuesta.
   - **Carrera Paralela de Instancias Piped de Alta Disponibilidad (`searchService.ts`):** Reemplazo del bucle secuencial sobre instancias obsoletas por una carrera paralela concurrente (`raceFirstSuccessful`) sobre endpoints Piped con CORS abierto y latencia < 500ms (`api.piped.private.coffee`, `pipedapi.ducks.party`).
   - **Resolución Directa de Audio Master:** Búsqueda orientada a pistas de audio de estudio limpias con fallback instantáneo a título y artista directo, garantizando inicio de reproducción limpio y sin anuncios de video comercial.

12. **Blindaje Integral Anti-Desplazamiento Horizontal en Móvil (`overflow-x`):**
   - **Control Global de Gestos Táctiles (`index.css` & `index.html`):** Configuración de `touch-action: pan-y;` en `html, body` junto con `overflow-x: hidden !important; width: 100%; max-width: 100%;`, bloqueando el desplazamiento o rebote lateral involuntario de derecha a izquierda en pantallas táctiles de iOS y Android.
   - **Eliminación de Viewport Spills (`App.tsx`):** Sustitución de `w-screen` (que excede el ancho útil en móviles con barras o subpíxeles) por `w-full max-w-full overflow-x-hidden min-w-0` en el contenedor raíz y en el scroll principal de vistas.
   - **Contención de Flex y Grid en Vistas:** Incorporación de `min-w-0 overflow-hidden` en las tarjetas de `HomeView`, `SongCard`, `SearchView`, `PlaylistView`, `LibraryView` y en la cabecera `TopNavbar`, impidiendo que los textos largos o inputs empujen el ancho fuera de la pantalla.




13. **Overhaul v2 de rendimiento y arquitectura:**
   - **Stores con suscripción selectiva** (`lib/store.ts`) en lugar de un Context monolítico: el tick del reproductor ya no re-renderiza toda la app. Detalles en `architecture.md`.
   - **Code splitting y Supabase bajo demanda:** JS inicial de 153 KB → ~84 KB gzip.
   - **Caché persistente de resolución:** una canción escuchada vuelve a sonar tras recargar sin ninguna petición de búsqueda.
   - **Reanudar sesión:** la app recuerda canción, cola y posición; también se usa para aplicar actualizaciones sin perder el contexto.
   - **Rutas por hash** (`#/artist/…`, `#/search/…`) enlazables y conectadas al botón atrás del sistema.
   - **Cola reordenable:** subir/bajar pistas y saltar a cualquiera con un toque en `QueueDrawer`.
   - **Importador de listas en paralelo** (4 búsquedas simultáneas con barra de progreso) y restauración de backup desde archivo `.json`; la restauración **combina** con la biblioteca existente en vez de sobrescribirla.
   - **Aviso de actualización no intrusivo:** nunca se recarga la app en mitad de una canción.
   - **Accesibilidad:** `aria-label`/`aria-pressed` en controles, foco visible coral, soporte de `prefers-reduced-motion`; el vinilo congela su ángulo al pausar en lugar de saltar a 0º.
