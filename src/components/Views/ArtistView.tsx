import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, BadgeCheck, Disc3 } from 'lucide-react';
import type { Song, Album, ArtistProfile } from '../../types/music';
import { usePlayer, playerActions } from '../../state/player';
import { getArtistProfile, getAlbumTracks } from '../../services/artistService';
import { toggleFollowArtist, useIsFollowing } from '../../services/storageService';
import { TrackRow } from '../UI/TrackRow';
import { Cover, Sheet, Sleeve } from '../UI/Primitives';
import { onImageError } from '../../lib/images';

interface ArtistViewProps {
  artistName: string;
  onNavigateBack: () => void;
  onNavigateArtist: (artistName: string) => void;
}

type Filter = 'all' | 'album' | 'single';

const TYPE_LABEL: Record<Album['type'], string> = { album: 'Álbum', single: 'Sencillo', ep: 'EP' };

function ArtistSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[340px] md:h-[420px] bg-paper/[0.04]" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="w-6 h-4 rounded bg-paper/[0.06]" />
            <div className="w-11 h-11 rounded-md bg-paper/[0.07]" />
            <div className="h-3.5 w-1/3 rounded bg-paper/[0.07]" />
          </div>
        ))}
      </div>
    </div>
  );
}

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

  if (isLoading) return <ArtistSkeleton />;

  if (!profile) {
    return (
      <div className="py-24 text-center max-w-sm mx-auto px-6">
        <Disc3 className="w-10 h-10 text-faint mx-auto" />
        <h2 className="font-display text-2xl font-bold text-paper mt-4">No encontramos a {artistName}</h2>
        <p className="text-[14px] text-mute mt-2">Prueba a buscarlo por una de sus canciones.</p>
        <button onClick={onNavigateBack} className="mt-6 h-11 px-6 rounded-full bg-paper text-ink font-semibold text-[14px]">
          Volver
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

  const chip = (value: Filter, label: string) => (
    <button
      onClick={() => setFilter(value)}
      className={`h-8 px-4 rounded-full text-[13px] font-medium transition-colors ${
        filter === value ? 'bg-paper text-ink' : 'bg-paper/[0.07] text-paper hover:bg-paper/[0.12]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full min-w-0 pb-8">
      {/* Cabecera a sangre */}
      <header className="relative h-[360px] sm:h-[420px] md:h-[480px] -mt-[calc(60px+env(safe-area-inset-top,0px))] md:-mt-[72px] overflow-hidden flex items-end">
        <img
          src={profile.pictureUrl}
          alt=""
          decoding="async"
          onError={onImageError}
          className="absolute inset-0 w-full h-full object-cover object-[center_25%] scale-105 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-8 stagger">
          <p className="flex items-center gap-1.5 text-[14px] font-medium text-paper">
            <BadgeCheck className="w-5 h-5 text-paper fill-brand-red" /> Artista verificado
          </p>
          <h1 className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-paper mt-2 break-words">
            {profile.name}
          </h1>
          {(profile.listeners ?? 0) > 0 && (
            <p className="text-[15px] text-paper/80 mt-4 tabular">
              {profile.listeners!.toLocaleString('es-ES')} seguidores en Deezer
            </p>
          )}
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="flex items-center gap-4 py-6">
          <button
            onClick={handlePlayArtist}
            disabled={!profile.topSongs.length}
            className="w-14 h-14 rounded-full bg-brand-red hover:bg-brand-lightred text-paper flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            title={isArtistPlaying ? 'Pausar' : `Reproducir ${profile.name}`}
          >
            {isArtistPlaying ? (
              <Pause className="w-6 h-6 fill-current" strokeWidth={0} />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-[1px]" strokeWidth={0} />
            )}
          </button>
          <button
            onClick={() => toggleFollowArtist({ name: profile.name, pictureUrl: profile.pictureUrl })}
            className={`h-9 px-5 rounded-full text-[14px] font-semibold border transition-colors ${
              isFollowing ? 'border-paper/60 text-paper' : 'border-paper/25 text-paper hover:border-paper'
            }`}
          >
            {isFollowing ? 'Siguiendo' : 'Seguir'}
          </button>
          {profile.genre && <span className="text-[14px] text-mute ml-auto">{profile.genre}</span>}
        </div>

        {profile.topSongs.length > 0 && (
          <section className="mt-2">
            <h2 className="font-display text-display-md font-bold text-paper mb-4">Populares</h2>
            <div className="-mx-2 md:-mx-3 max-w-4xl">
              {topSongs.map((song, index) => (
                <TrackRow key={song.id} song={song} contextQueue={profile.topSongs} number={index + 1} subtitle="album" />
              ))}
            </div>
            {profile.topSongs.length > 5 && (
              <button
                onClick={() => setShowAllTop((v) => !v)}
                className="mt-3 text-[14px] font-semibold text-mute hover:text-paper transition-colors"
              >
                {showAllTop ? 'Mostrar menos' : 'Mostrar más'}
              </button>
            )}
          </section>
        )}

        <section className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-display-md font-bold text-paper">Discografía</h2>
            <div className="flex items-center gap-2">
              {chip('all', 'Todo')}
              {chip('album', 'Álbumes')}
              {chip('single', 'Sencillos y EP')}
            </div>
          </div>

          {albums.length === 0 ? (
            <p className="text-mute text-[14px] py-8">No hay lanzamientos en esta categoría.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-x-5 gap-y-8">
              {albums.map((album) => (
                <button key={album.id} onClick={() => setSelectedAlbum(album)} className="group sleeve-peek text-left min-w-0">
                  <Sleeve
                    src={album.coverUrl}
                    size={400}
                    isPlaying={false}
                    slide="20%"
                    coverClassName="rounded-lg"
                    className="w-[84%] aspect-square"
                    alt={album.title}
                  />
                  <p className="text-[14px] font-semibold text-paper truncate mt-3 pr-[16%] group-hover:underline decoration-paper/30 underline-offset-2">
                    {album.title}
                  </p>
                  <p className="text-[13px] text-mute">
                    {album.releaseYear}
                    {album.releaseYear && ', '}
                    {TYPE_LABEL[album.type].toLowerCase()}
                  </p>
                </button>
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

  return (
    <Sheet onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-end gap-5 min-w-0 mb-6 pr-10">
        <Cover src={album.coverUrl} size={260} eager alt={album.title} className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[13px] text-mute">{TYPE_LABEL[album.type]}</p>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-paper leading-tight mt-1">{album.title}</h3>
          <p className="text-[13px] text-mute mt-2">
            {album.artist}
            {album.releaseYear && `, ${album.releaseYear}`}
            {tracks && `, ${tracks.length} canciones`}
          </p>
        </div>
      </div>

      {tracks === null ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-paper/[0.05]" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <p className="text-center text-mute py-12 text-[14px]">No se encontraron las canciones de este disco.</p>
      ) : (
        <>
          <button
            onClick={() => playerActions.playSong(tracks[0], tracks)}
            className="mb-4 h-11 pl-4 pr-5 rounded-full bg-brand-red hover:bg-brand-lightred text-paper font-semibold text-[14px] flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" strokeWidth={0} />
            Reproducir disco
          </button>
          <div className="-mx-2">
            {tracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                song={track}
                contextQueue={tracks}
                number={idx + 1}
                showCover={false}
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
