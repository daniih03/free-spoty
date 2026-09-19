# 📱 Catálogo de Funcionalidades de Free-Spoty

Este documento describe todas las características implementadas en **Free-Spoty**, su diseño inspirado en Spotify y los detalles de interacción.

---

## 🌟 Resumen de Funcionalidades

| Característica | Estado | Ubicación Principal |
| :--- | :--- | :--- |
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
  - **Hero Banner:** Fotografía del artista en gran formato (resolución 1000x1000 de Deezer), insignia de **Artista Verificado**, nombre en tipografía negrita destacada, conteo de oyentes mensuales y botón verde circular de reproducción total.
  - **Canciones Populares:** Lista interactiva con los 10 temas más escuchados del artista, duraciones reales y botón para añadir a favoritos.
  - **Discografía Completa:**
    - Filtro por pestañas: **Todos**, **Álbumes**, y **Sencillos / EPs**.
    - Cuadrícula con carátulas en alta definición, año de lanzamiento y tipo de publicación.
- **Explorador de Álbumes (`AlbumModal.tsx`):**
  - Al pulsar sobre cualquier disco, se despliega un modal con la lista de temas del álbum.
  - Permite reproducir canciones específicas o el álbum completo en orden.

---

## 📜 3. Letras Sincronizadas en Vivo (`LyricsView.tsx`)

- **Proveedor:** Integración con la API de LRCLIB mediante `lyricsService.ts`.
- **Sincronización al Milisegundo:** El bucle de tiempo (`timeTracker`) del reproductor corre 4 veces por segundo (cada 250ms), logrando transiciones fluidas de estrofas.
- **Scroll Automático Inteligente:** La línea actual se resalta con texto blanco agrandado (`text-white font-bold scale-105`) y se desplaza automáticamente hacia el tercio central de la pantalla.
- **Modo Pantalla Completa:** Accesible con la tecla `F` o pulsando el icono de letras en la barra inferior. Cuenta con fondo dinámico derivado de la carátula y controles de transporte flotantes.

---

## 🎵 4. Reproductor Multipantalla Adaptativo

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

- Opciones preconfiguradas: 5, 10, 15, 30, 45, 60 minutos o fin de la pista actual.
- **Desvanecimiento Suave (Smooth Fade Out):** En los últimos 10 segundos antes de expirar, el volumen se atenúa progresivamente hasta 0 para no despertar al usuario bruscamente, tras lo cual se pausa la reproducción de forma limpia.

---

## 📱 7. MediaSession API Nativa

- Conexión con los controladores del sistema operativo (iOS Dynamic Island, pantalla de bloqueo de Android, teclas multimedia de teclados Windows/Mac).
- Metadatos sincronizados: título, artista, álbum y conjunto de carátulas en resoluciones 192x192 y 512x512.
- Manejadores soportados: `play`, `pause`, `nexttrack`, `previoustrack`, `seekto`.

---

## 🎨 8. Identidad Visual y Sistema de Diseño de Marca

La interfaz está construida con una paleta cromática sofisticada basada exclusivamente en **tonos de rojo hiperprofesionales y fondos carbón mate**, sin presencia alguna de verdes:

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
| **Rosa Cálido** | `#ff6b57` | Subtítulos, etiquetas de fidelidad de audio y chips informativos |
| **Blanco Puro** | `#ffffff` | Iconografía dentro de botones de acción, glifos del logo y tipografía titular |

---

## 🔮 9. Rediseño Minimalista Studio (Aura UI vs Spotify)

Para alejarse de la saturada y rígida interfaz tradicional de Spotify, Free-Spoty implementa una arquitectura visual **espaciosa, ergonómica y futurista**:

1. **SmartDock Flotante (`SmartDock.tsx`):**
   - Sustituye a la columna lateral fija de 280px por un rail suspendido en 3D (`left-4`, `w-[68px]`).
   - Al posar el cursor, se expande suavemente a 240px con efecto blur `backdrop-blur-2xl bg-[#121217]/85` sin desplazar el contenido ni provocar saltos de diseño (cero layout shift).
   - Libera más del 90% del ancho del viewport para la música.

2. **Cápsula de Sonido Flotante (`FloatingPlayer.tsx`):**
   - Sustituye la barra inferior fija de 96px por una píldora flotante centrada (`bottom-5`, `max-w-4xl`, `rounded-full`).
   - Barra de progreso (scrubber) integrada en el borde perimétrico superior con hover responsivo.
   - Vinilo en rotación continua sincronizado con el estado de reproducción (`animate-spin-slow`).
   - Botón central de reproducción con gradiente escarlata-carmesí (`from-brand-crimson via-brand-red to-brand-coral`).
   - Control de volumen expansible que se oculta inteligentemente para mantener el minimalismo.
   - En móvil, cápsula flotante sobre la barra de navegación con acceso a la hoja inmersiva **Zen Listening Sheet**.

3. **Tarjetas Minimalistas Aura (`SongCard.tsx`):**
   - Bordes redondeados ultra-suaves (`rounded-2xl md:rounded-[22px]`) con vidrio esmerilado carbón.
   - Iluminación perimétrica reactiva (rim glow) al hacer hover.
   - **Indicador Soundwave Dinámico:** Cuando un tema está en reproducción activa, una insignia de ecualizador de 3 barras pulsantes escarlatas indica el estado visualmente en tiempo real.
   - Acciones integradas: Me Gusta con micro-blur, botón Play flotante, menú contextual con opciones de cola y guardado en listas.

4. **Fondo Midnight Obsidian Indigo (`AmbientBackground.tsx`):**
   - Fondo base oscuro profundo (`#090b10`) combinado con un resplandor índigo nocturno (`rgb(22, 28, 45)`).
   - Filtro anti-verdes que previene la filtración de tonalidades verdosas al procesar carátulas externas.



