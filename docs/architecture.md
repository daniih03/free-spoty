# 🏗️ Arquitectura de Free-Spoty

Este documento describe la arquitectura general de **Free-Spoty**, la jerarquía de componentes, la gestión de estados y el flujo de datos que permite ofrecer una experiencia similar a una aplicación nativa.

---

## 🧩 Diagrama de Componentes y Flujo de Datos

```mermaid
flowchart TD
    subgraph UI ["Capa de Presentación (React 18 + Tailwind)"]
        App["App.tsx (Enrutador de Vistas e Historial)"]
        Sidebar["Sidebar (Navegación Desktop)"]
        MobileNav["MobileNav (Navegación Móvil)"]
        Header["Header (Búsqueda, Perfil, Actualizador)"]
        
        subgraph Views ["Vistas Principales"]
            HomeView["HomeView (Listas destacadas y Mix)"]
            SearchView["SearchView (Buscador y Tarjeta Spotlight)"]
            PlaylistView["PlaylistView (Vista de Álbum / Playlist)"]
            ArtistView["ArtistView (Perfil Spotify: Portada, Top, Discografía)"]
            LyricsView["LyricsView (Letras Sincronizadas Fullscreen)"]
        end

        subgraph PlayerUI ["Controles del Reproductor"]
            BottomPlayer["BottomPlayer (Desktop Bar / Mobile Mini / Fullsheet)"]
            SongCard["SongCard (Tarjetas con Play Overlay)"]
        end
    end

    subgraph State ["Capa de Estado Global (React Context)"]
        PlayerCtx["PlayerContext (isPlaying, currentSong, queue, progress)"]
        MusicCtx["MusicContext (playlists, likedSongs, history)"]
    end

    subgraph Services ["Capa de Servicios y Red"]
        SearchSvc["searchService.ts (iTunes API + Invidious Resolver)"]
        ArtistSvc["artistService.ts (iTunes Discography + Deezer Visuals)"]
        LyricsSvc["lyricsService.ts (LRCLIB Synced Lyrics API)"]
        YTSvc["youtube.ts (YouTube Iframe Engine + HTMLAudio Fallback)"]
    end

    App --> Header
    App --> Sidebar
    App --> MobileNav
    App --> Views
    App --> BottomPlayer

    Views --> PlayerCtx
    Views --> MusicCtx
    PlayerUI --> PlayerCtx
    PlayerUI --> MusicCtx

    PlayerCtx --> YTSvc
    PlayerCtx --> SearchSvc
    PlayerCtx --> LyricsSvc
    SearchView --> SearchSvc
    ArtistView --> ArtistSvc
```

---

## 📁 Estructura del Código Fuente (`src/`)

```text
src/
├── App.tsx                      # Orquestador raíz: gestión de rutas ('home' | 'search' | 'playlist' | 'artist') y pila de historial
├── main.tsx                     # Punto de entrada de React 18 en Vite
├── index.css                    # Estilos globales y personalización Tailwind
├── types/
│   └── music.ts                 # Interfaces TypeScript: Song, Album, ArtistProfile, Playlist, etc.
├── context/
│   ├── PlayerContext.tsx        # Estado del reproductor, sincronización de eventos de YouTube, cola, volumen y MediaSession
│   └── MusicContext.tsx         # Gestión de favoritos, playlists personalizadas e historial local
├── components/
│   ├── Layout/
│   │   ├── Header.tsx           # Barra superior: buscador, botones atrás/adelante, indicador de versión
│   │   ├── Sidebar.tsx          # Menú lateral para pantallas de escritorio
│   │   └── MobileNav.tsx        # Barra de navegación inferior fija para móviles
│   ├── Player/
│   │   ├── BottomPlayer.tsx     # Barra inferior en desktop, mini-player y hoja modal a pantalla completa en móvil
│   │   └── LyricsView.tsx       # Pantalla completa de letras sincronizadas con scroll automático
│   ├── UI/
│   │   ├── SongCard.tsx         # Tarjeta de canción reutilizable con botón Play y menú de 3 puntos
│   │   ├── Modal.tsx            # Modal genérico para crear playlists
│   │   └── AlbumModal.tsx       # Modal para ver y reproducir canciones de un álbum específico
│   └── Views/
│       ├── HomeView.tsx         # Pantalla de inicio con playlists destacadas
│       ├── SearchView.tsx       # Buscador instantáneo con tarjeta "Resultado principal"
│       ├── PlaylistView.tsx     # Vista detallada de listas de reproducción
│       └── ArtistView.tsx       # Perfil oficial de artista estilo Spotify
└── services/
    ├── youtube.ts               # Motor de reproducción de YouTube Iframe API y gestor de watchdog
    ├── searchService.ts         # Consultas de metadatos (iTunes) y resolución dinámica de audio (Invidious)
    ├── artistService.ts         # Obtención de discografía, portadas en 1000x1000 y conteo de oyentes
    ├── lyricsService.ts         # Proveedor de letras sincronizadas (LRCLIB)
    └── exploreData.ts           # Listas destacadas precargadas con metadatos verificados
```

---

## 🔄 Gestión de Rutas y Navegación Interna

Para garantizar máxima compatibilidad con **GitHub Pages** sin problemas de enrutamiento del lado del servidor (404 en refresco), la aplicación utiliza un **sistema de enrutamiento basado en estado e historial**:

1. **Vistas Soportadas (`ViewType`):**
   - `'home'`: Pantalla principal con accesos rápidos y secciones.
   - `'search'`: Explorador y resultados de búsqueda.
   - `'playlist'`: Contenido de una lista o álbum.
   - `'artist'`: Perfil completo del artista seleccionado (`selectedArtistName`).
2. **Pila de Historial (`historyStack`):**
   - Cada cambio de vista añade la vista anterior a una pila (`historyStack: ViewState[]`).
   - El botón atrás (`←`) desapila y restaura la vista previa exactamente en su estado, permitiendo navegar entre canciones, artistas y listas con total naturalidad tanto en escritorio como en móvil.
3. **Navegación al Artista (`onNavigateArtist`):**
   - Una función centralizada inyectada en todos los componentes (`SongCard`, `SearchView`, `PlaylistView`, `BottomPlayer`, `LyricsView`).
   - Al pulsar sobre el nombre del artista en cualquier parte de la aplicación, el usuario es redirigido inmediatamente a la vista `'artist'`.

---

## 🎛️ Contextos Principales

### 1. `PlayerContext` (`src/context/PlayerContext.tsx`)
- **Responsabilidades:**
  - Control de reproducción: `playSong(song, contextQueue)`, `togglePlay()`, `seek(seconds)`, `nextTrack()`, `prevTrack()`.
  - Estados reactivos: `isPlaying`, `isLoadingSong`, `currentTime`, `duration`, `volume`, `isMuted`, `isShuffle`, `repeatMode` (`'off' | 'all' | 'one'`).
  - **Sincronización con YouTube Engine:** Escucha cambios de estado (`onStateChange`) y códigos de error (`onError`).
  - **MediaSession API:** Actualiza los controles de la pantalla de bloqueo de iOS/Android con el título, artista y carátulas en 512x512.
  - **Letras Sincronizadas:** Dispara automáticamente la descarga de letras a través de `fetchLyrics` al cambiar de tema.

### 2. `MusicContext` (`src/context/MusicContext.tsx`)
- **Responsabilidades:**
  - Persistencia en `localStorage` de las canciones favoritas (`likedSongs`).
  - Creación, edición y borrado de playlists del usuario.
  - Historial reciente de reproducción (`playHistory`).
