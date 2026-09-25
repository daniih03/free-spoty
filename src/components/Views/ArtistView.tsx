import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, BadgeCheck, Disc3 } from 'lucide-react';
import type { Song, Album, ArtistProfile } from '../../types/music';
import { usePlayer, playerActions } from '../../state/player';
import { getArtistProfile, getAlbumTracks } from '../../services/artistService';
import { toggleFollowArtist, useIsFollowing } from '../../services/storageService';
import { TrackRow } from '../UI/TrackRow';
import { Cover, Sheet, Spinner } from '../UI/Primitives';
import { onImageError } from '../../lib/images';

interface ArtistViewProps {
  artistName: string;
  onNavigateBack: () => void;
  onNavigateArtist: (artistName: string) => void;
}

type Filter = 'all' | 'album' | 'single';

export default function ArtistView({ artistName, onNavigateBack, onNavigateArtist }: ArtistViewProps) {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [showAllTop, setShowAllTop] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const isFollowing = useIsFollowing(profile?.name || artistName);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setSelectedAlbum(null);
    setShowAllTop(false);
    getArtistProfile(artistName).then((data) => {
      if (!active) return;
      setProfile(data);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [artistName]);

  const topIds = useMemo(() => new Set(profile?.topSongs.map((s) => s.id)), [profile]);
  const isArtistPlaying = usePlayer((s) => s.isPlaying && !!s.currentSong && topIds.has(s.currentSong.id));
  const isArtistCurrent = usePlayer((s) => !!s.currentSong && topIds.has(s.currentSong.id));

  const albums = useMemo(() => {
    if (!profile) return [];
    if (filter === 'album') return profile.albums.filter((a) => a.type === 'album');
    if (filter === 'single') return profile.albums.filter((a) => a.type !== 'album');
    return profile.albums;
  }, [profile, filter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner className="w-12 h-12 border-3 border-brand-red" />
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

  const topSongs = showAllTop ? profile.topSongs : profile.topSongs.slice(0, 5);

  const handlePlayArtist = () => {
    if (!profile.topSongs.length) return;
    if (isArtistCurrent) playerActions.togglePlay();
    else playerActions.playSong(profile.topSongs[0], profile.topSongs);
  };

  const pill = (value: Filter, label: string) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
        filter === value
          ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md shadow-brand-red/20'
          : 'text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12 w-full min-w-0">
      {/* 1. Hero */}
      <div className="relative h-72 sm:h-96 md:h-[420px] overflow-hidden flex flex-col justify-end p-5 sm:p-6 md:p-10">
        <div className="absolute inset-0 z-0">
          <img
            src={profile.pictureUrl}
            alt={profile.name}
            decoding="async"
            onError={onImageError}
            className="w-full h-full object-cover object-center brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        </div>

        <div className="relative z-10 space-y-2 md:space-y-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-white/90 drop-shadow-md">
            <BadgeCheck className="w-5 h-5 text-brand-red fill-brand-red/20" />
            <span>Artista verificado</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight drop-shadow-xl truncate">
            {profile.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-300 font-medium drop-shadow-md">
            {(profile.listeners ?? 0) > 0 && (
              <>
                <span>
                  <span className="text-white font-bold">{profile.listeners!.toLocaleString('es-ES')}</span> fans
                </span>
                <span>•</span>
              </>
            )}
            <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white/90 text-xs uppercase tracking-wider font-semibold">
              {profile.genre || 'Música'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3.5 sm:px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
        {/* 2. Acciones */}
        <div className="flex items-center gap-5">
          <button
            onClick={handlePlayArtist}
            disabled={!profile.topSongs.length}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-crimson via-brand-red to-brand-coral text-white flex items-center justify-center shadow-2xl shadow-brand-red/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            title={isArtistPlaying ? 'Pausar' : `Reproducir populares de ${profile.name}`}
          >
            {isArtistPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
          </button>
          <button
            onClick={() => toggleFollowArtist({ name: profile.name, pictureUrl: profile.pictureUrl })}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
              isFollowing
                ? 'border-brand-red text-brand-coral bg-brand-red/10 hover:bg-brand-red/20'
                : 'border-white/30 hover:border-white text-white hover:scale-105'
            }`}
          >
            {isFollowing ? 'Siguiendo' : 'Seguir'}
          </button>
        </div>

        {/* 3. Populares */}
        {profile.topSongs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Populares</h2>
            <div className="space-y-1">
              {topSongs.map((song, index) => (
                <TrackRow
                  key={song.id}
                  song={song}
                  contextQueue={profile.topSongs}
                  number={index + 1}
                  variant="plain"
                  subtitle="album"
                />
              ))}
            </div>
            {profile.topSongs.length > 5 && (
              <button
                onClick={() => setShowAllTop((v) => !v)}
                className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider py-2 transition-colors"
              >
                {showAllTop ? 'Ver menos' : 'Ver más canciones'}
              </button>
            )}
          </section>
        )}

        {/* 4. Discografía */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Discografía</h2>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
              {pill('all', 'Todos')}
              {pill('album', 'Álbumes')}
              {pill('single', 'Sencillos y EPs')}
            </div>
          </div>

          {albums.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">No hay discos en esta categoría.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {albums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="group relative p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-brand-red/30 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1 transform-gpu min-w-0"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-white/5 shadow-md">
                    <Cover
                      src={album.coverUrl}
                      size={400}
                      alt={album.title}
                      className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 right-2 opacity-90 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-200">
                      <div className="w-10 h-10 rounded-full bg-brand-red hover:bg-brand-lightred text-white flex items-center justify-center shadow-xl">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate mb-1 group-hover:text-brand-coral transition-colors">
                    {album.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span>{album.releaseYear || 'Álbum'}</span>
                    <span>•</span>
                    <span>{album.type === 'single' ? 'Sencillo' : album.type === 'ep' ? 'EP' : 'Álbum'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedAlbum && (
        <AlbumSheet album={selectedAlbum} onClose={() => setSelectedAlbum(null)} onNavigateArtist={onNavigateArtist} />
      )}
    </div>
  );
}

function AlbumSheet({
  album,
  onClose,
  onNavigateArtist,
}: {
  album: Album;
  onClose: () => void;
  onNavigateArtist: (artistName: string) => void;
}) {
  const [tracks, setTracks] = useState<Song[] | null>(null);

  useEffect(() => {
    let active = true;
    getAlbumTracks(album.id, album.artist).then((t) => active && setTracks(t));
    return () => {
      active = false;
    };
  }, [album]);

  const typeLabel = album.type === 'single' ? 'Sencillo' : album.type === 'ep' ? 'EP' : 'Álbum oficial';

  return (
    <Sheet onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center gap-4 min-w-0 mb-5 pr-10">
        <Cover src={album.coverUrl} size={160} eager alt={album.title} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-lg flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-coral">{typeLabel}</span>
          <h3 className="text-lg md:text-xl font-bold text-white truncate">{album.title}</h3>
          <p className="text-xs text-zinc-400">
            {album.artist} • {album.releaseYear} • {tracks?.length ?? album.trackCount} canciones
          </p>
        </div>
      </div>

      {tracks === null ? (
        <div className="py-16 text-center space-y-3">
          <Spinner className="w-8 h-8 border-2 border-brand-red" />
          <p className="text-xs text-zinc-400">Cargando canciones del disco...</p>
        </div>
      ) : tracks.length === 0 ? (
        <p className="text-center text-zinc-500 py-12 text-sm">No se encontraron pistas para este disco.</p>
      ) : (
        <>
          <button
            onClick={() => playerActions.playSong(tracks[0], tracks)}
            className="mb-3 flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white font-bold text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand-red/20"
          >
            <Play className="w-4 h-4 fill-white" />
            Reproducir disco completo
          </button>
          <div className="space-y-1">
            {tracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                song={track}
                contextQueue={tracks}
                number={idx + 1}
                showCover={false}
                variant="plain"
                onNavigateArtist={(name) => {
                  onClose();
                  onNavigateArtist(name);
                }}
              />
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
