import React, { useState, useEffect } from 'react';
import { Song, Album, ArtistProfile } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { getArtistProfile, getAlbumTracks } from '../../services/artistService';
import { isSongLiked, toggleLikeSong } from '../../services/storageService';
import {
  Play,
  Pause,
  Heart,
  BadgeCheck,
  Disc3,
  Clock,
  ArrowLeft,
  Music,
  ListMusic,
  ChevronRight,
  X,
} from 'lucide-react';

interface ArtistViewProps {
  artistName: string;
  onNavigateBack: () => void;
  onNavigateArtist?: (artistName: string) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artistName, onNavigateBack }) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [discographyFilter, setDiscographyFilter] = useState<'all' | 'album' | 'single'>('all');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAllTopSongs, setShowAllTopSongs] = useState(false);

  // Selected album modal / drawer
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Song[]>([]);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setSelectedAlbum(null);

    getArtistProfile(artistName).then((data) => {
      if (isMounted) {
        setProfile(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [artistName]);

  const handleOpenAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setIsLoadingAlbum(true);
    const tracks = await getAlbumTracks(album.id, album.artist);
    setAlbumTracks(tracks);
    setIsLoadingAlbum(false);
  };

  const handlePlayArtist = () => {
    if (!profile || profile.topSongs.length === 0) return;
    const isArtistPlaying = profile.topSongs.some((s) => s.id === currentSong?.id);
    if (isArtistPlaying) {
      togglePlay();
    } else {
      playSong(profile.topSongs[0], profile.topSongs);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = Math.floor(sec % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-3 border-[#c81900] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-400 animate-pulse">Cargando discografía de {artistName}...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-4">
        <Disc3 className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">No pudimos encontrar a {artistName}</h2>
        <p className="text-zinc-400 text-sm">Verifica el nombre o prueba buscando otra canción.</p>
        <button
          onClick={onNavigateBack}
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  const filteredAlbums = profile.albums.filter((album) => {
    if (discographyFilter === 'album') return album.type === 'album';
    if (discographyFilter === 'single') return album.type === 'single' || album.type === 'ep';
    return true;
  });

  const displayedTopSongs = showAllTopSongs ? profile.topSongs : profile.topSongs.slice(0, 5);
  const isCurrentArtistPlaying = profile.topSongs.some((s) => s.id === currentSong?.id) && isPlaying;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. Hero Banner with High-Res Artist Portrait */}
      <div className="relative -mx-6 -mt-6 h-72 sm:h-96 md:h-[420px] overflow-hidden flex flex-col justify-end p-6 md:p-10 select-none">
        {/* Background Image with Dark Gradient Overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src={profile.pictureUrl}
            alt={profile.name}
            className="w-full h-full object-cover object-center filter brightness-90 transform-gpu"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-2 md:space-y-3">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-white/90 drop-shadow-md">
            <BadgeCheck className="w-5 h-5 text-[#c81900] fill-[#c81900]/20" />
            <span>Artista Verificado</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight drop-shadow-xl truncate">
            {profile.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-300 font-medium drop-shadow-md">
            {(profile.listeners ?? 0) > 0 && (
              <>
                <span className="text-white font-bold">{(profile.listeners ?? 0).toLocaleString()}</span>
                <span>oyentes mensuales</span>
                <span>•</span>
              </>
            )}
            <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white/90 text-xs uppercase tracking-wider font-semibold">
              {profile.genre || 'Música'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Primary Action Bar */}
      <div className="flex items-center gap-5 px-1">
        <button
          onClick={handlePlayArtist}
          disabled={profile.topSongs.length === 0}
          className="w-14 h-14 rounded-full bg-[#c81900] hover:bg-[#e02200] text-white flex items-center justify-center shadow-2xl shadow-[#c81900]/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
          title={isCurrentArtistPlaying ? 'Pausar' : `Reproducir canciones populares de ${profile.name}`}
        >
          {isCurrentArtistPlaying ? (
            <Pause className="w-6 h-6 fill-white text-white" />
          ) : (
            <Play className="w-6 h-6 fill-white text-white ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setIsFollowing((prev) => !prev)}
          className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
            isFollowing
              ? 'border-[#c81900] text-[#c81900] bg-[#c81900]/10 hover:bg-[#c81900]/20'
              : 'border-white/30 hover:border-white text-white hover:scale-105'
          }`}
        >
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
      </div>

      {/* 3. Popular Songs (Top 10) */}
      {profile.topSongs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">Populares</h2>

          <div className="space-y-1">
            {displayedTopSongs.map((song, index) => {
              const isCurrent = currentSong?.id === song.id;
              const isLiked = isSongLiked(song.id);

              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, profile.topSongs)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                    isCurrent ? 'bg-white/15 text-[#c81900]' : 'hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  {/* Left: Index / Play & Cover & Title */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div className="w-6 text-center text-sm font-semibold text-zinc-400 group-hover:hidden">
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-3.5">
                          <span className="w-1 bg-[#c81900] h-full animate-bounce" />
                          <span className="w-1 bg-[#c81900] h-2/3 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 bg-[#c81900] h-4/5 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="w-6 text-center hidden group-hover:block text-white">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current mx-auto text-[#c81900]" />
                      ) : (
                        <Play className="w-4 h-4 fill-current mx-auto" />
                      )}
                    </div>

                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      loading="lazy"
                      className="w-10 h-10 rounded-lg object-cover shadow-md flex-shrink-0"
                    />

                    <div className="min-w-0 flex-1 pr-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-[#c81900]' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{song.album || profile.name}</p>
                    </div>
                  </div>

                  {/* Right: Like & Duration */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeSong(song);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isLiked ? 'text-[#c81900]' : 'text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100'
                      }`}
                      title={isLiked ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>

                    <span className="text-xs text-zinc-400 font-mono w-10 text-right">
                      {formatDuration(song.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {profile.topSongs.length > 5 && (
            <button
              onClick={() => setShowAllTopSongs((prev) => !prev)}
              className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider py-2 transition-colors cursor-pointer"
            >
              {showAllTopSongs ? 'Ver menos' : 'Ver más canciones'}
            </button>
          )}
        </section>
      )}

      {/* 4. Discography (Albums, Singles & EPs) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">Discografía</h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => setDiscographyFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                discographyFilter === 'all'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setDiscographyFilter('album')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                discographyFilter === 'album'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Álbumes
            </button>
            <button
              onClick={() => setDiscographyFilter('single')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                discographyFilter === 'single'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sencillos y EPs
            </button>
          </div>
        </div>

        {filteredAlbums.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">No hay discos en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => handleOpenAlbum(album)}
                className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1 transform-gpu"
              >
                {/* Album Cover with Play Button overlay */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-white/5 shadow-md">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 right-2 opacity-90 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-200">
                    <div className="w-10 h-10 rounded-full bg-[#c81900] hover:bg-[#e02200] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <h4 className="text-sm font-semibold text-white truncate mb-1 group-hover:text-[#c81900] transition-colors">
                  {album.title}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>{album.releaseYear || 'Álbum'}</span>
                  <span>•</span>
                  <span className="capitalize">
                    {album.type === 'single' ? 'Sencillo' : album.type === 'ep' ? 'EP' : 'Álbum'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Album Tracks Modal / Bottom Sheet */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={selectedAlbum.coverUrl}
                  alt={selectedAlbum.title}
                  className="w-16 h-16 rounded-xl object-cover shadow-lg flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#c81900]">
                    {selectedAlbum.type === 'single' ? 'Sencillo' : selectedAlbum.type === 'ep' ? 'EP' : 'Álbum Oficial'}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-white truncate">{selectedAlbum.title}</h3>
                  <p className="text-xs text-zinc-400">
                    {selectedAlbum.artist} • {selectedAlbum.releaseYear} • {albumTracks.length} canciones
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlbum(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Tracks List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 scrollbar-thin">
              {isLoadingAlbum ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#c81900] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-zinc-400">Cargando canciones del disco...</p>
                </div>
              ) : albumTracks.length === 0 ? (
                <p className="text-center text-zinc-500 py-12 text-sm">No se encontraron pistas para este disco.</p>
              ) : (
                <>
                  <div className="pb-3 mb-2 flex items-center justify-between">
                    <button
                      onClick={() => playSong(albumTracks[0], albumTracks)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c81900] hover:bg-[#e02200] text-white font-bold text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-[#c81900]/20"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Reproducir Disco Completo
                    </button>
                  </div>

                  {albumTracks.map((track, idx) => {
                    const isCurrent = currentSong?.id === track.id;
                    const isLiked = isSongLiked(track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => playSong(track, albumTracks)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                          isCurrent ? 'bg-white/15 text-[#c81900]' : 'hover:bg-white/10 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:text-white">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isCurrent ? 'text-[#c81900]' : 'text-white'
                              }`}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikeSong(track);
                            }}
                            className={`p-1.5 rounded-full transition-colors ${
                              isLiked ? 'text-[#c81900]' : 'text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                          </button>
                          <span className="text-xs text-zinc-400 font-mono w-10 text-right">
                            {formatDuration(track.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
