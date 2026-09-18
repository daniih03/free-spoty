import { Playlist, Song } from '../types/music';

export const FEATURED_PLAYLISTS: Playlist[] = [
  {
    id: 'top-global',
    name: 'Top 50 Global',
    description: 'Los mayores éxitos que están sonando en todo el mundo ahora mismo.',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    songs: [
      {
        id: 'yt_houdini',
        title: 'Houdini',
        artist: 'Dua Lipa',
        album: 'Radical Optimism',
        duration: 185,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/05/85/ca/0585ca45-9a84-0a65-1d63-5491796d11f8/190296181467.jpg/600x600bb.jpg',
        youtubeId: 'BHIpvqhydLo', // Dua Lipa - Houdini (Lyrics) - Ad-free community upload
        currentVersion: 'radio',
        availableVersions: {
          radio: 'BHIpvqhydLo',
          lyrics: 'BHIpvqhydLo',
          original: 'BHIpvqhydLo'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_blinding_lights',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: 200,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/25/74/bf257404-5858-a400-0e42-1fb3950ef775/20UMGIM08611.rgb.jpg/600x600bb.jpg',
        youtubeId: '4NRXx6U8ABQ', // Blinding Lights (Official Audio)
        currentVersion: 'radio',
        availableVersions: {
          radio: '4NRXx6U8ABQ',
          lyrics: 'XbGs_qK2PQA',
          original: '4NRXx6U8ABQ'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_espresso',
        title: 'Espresso',
        artist: 'Sabrina Carpenter',
        album: 'Short n\' Sweet',
        duration: 175,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/64/63/1f/64631f13-ee0b-db7f-561b-90f92b772c68/24UMGIM47820.rgb.jpg/600x600bb.jpg',
        youtubeId: '2I9eC2MRhto', // Sabrina Carpenter - Espresso (Lyrics) - Ad-free
        currentVersion: 'radio',
        availableVersions: {
          radio: '2I9eC2MRhto',
          lyrics: '2I9eC2MRhto',
          original: '2I9eC2MRhto'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_as_it_was',
        title: 'As It Was',
        artist: 'Harry Styles',
        album: 'Harry\'s House',
        duration: 167,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/dc/4b/32/dc4b3208-8e65-a83d-3b74-12ea2c1ea3ad/886449989679.jpg/600x600bb.jpg',
        youtubeId: 'H5v3kku4y6Q',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'H5v3kku4y6Q',
          lyrics: 'e-O1b5Jp6-g',
          original: 'H5v3kku4y6Q'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_cruel_summer',
        title: 'Cruel Summer',
        artist: 'Taylor Swift',
        album: 'Lover',
        duration: 178,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/74/13/2e/74132e4d-7a76-2007-88f5-93ec5d81b379/19UMGIM53909.rgb.jpg/600x600bb.jpg',
        youtubeId: 'ic8j13piAhQ',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'ic8j13piAhQ',
          lyrics: 'kIHCflZc9wU',
          original: 'ic8j13piAhQ'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_birds_feather',
        title: 'BIRDS OF A FEATHER',
        artist: 'Billie Eilish',
        album: 'HIT ME HARD AND SOFT',
        duration: 190,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/77/89/a3/7789a318-7b9c-7e61-a5be-91c64eb324a1/24UMGIM39257.rgb.jpg/600x600bb.jpg',
        youtubeId: 'd5gf9dXbPi0',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'd5gf9dXbPi0',
          lyrics: 'eXJ6vX0Fq-A',
          original: 'd5gf9dXbPi0'
        },
        hasSyncedLyrics: true
      }
    ]
  },
  {
    id: 'top-latin',
    name: 'Éxitos España & Urbano Latino',
    description: 'El reggaeton, trap y pop urbano que está reventando las listas.',
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    songs: [
      {
        id: 'yt_monaco',
        title: 'MONACO',
        artist: 'Bad Bunny',
        album: 'nadie sabe lo que va a pasar mañana',
        duration: 267,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c3/56/9e/c3569e2a-e152-e9e0-c8aa-d5ca35e408ec/197189704257.jpg/600x600bb.jpg',
        youtubeId: 'WzM7a5h2dbs', // Clean audio
        currentVersion: 'radio',
        availableVersions: {
          radio: 'WzM7a5h2dbs',
          lyrics: 'uI4vXwV9t-8',
          original: 'XbZ0D8J8XkI'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_bizarrap_quevedo',
        title: 'Quevedo: Bzrp Music Sessions, Vol. 52',
        artist: 'Bizarrap & Quevedo',
        album: 'Bzrp Music Sessions',
        duration: 200,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/73/80/7e/73807e32-a5ec-08be-ffae-e42a03cf81b1/196925585141.jpg/600x600bb.jpg',
        youtubeId: 'A_g3lMcWVy0',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'A_g3lMcWVy0',
          lyrics: 'A_g3lMcWVy0',
          original: 'A_g3lMcWVy0'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_lala',
        title: 'LALA',
        artist: 'Myke Towers',
        album: 'LA VIDA ES UNA',
        duration: 198,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/b8/b6/ec/b8b6ec26-3ff4-c1f0-0ef5-5aa30c25a0a3/190296181467.jpg/600x600bb.jpg',
        youtubeId: 'p2wNl4Z-00I',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'p2wNl4Z-00I',
          lyrics: '2i5yF4Y7g24',
          original: 'p2wNl4Z-00I'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_columbia',
        title: 'Columbia',
        artist: 'Quevedo',
        album: 'Buenas Noches',
        duration: 186,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/05/1c/b4/051cb4ee-590b-a6be-ebcf-f0c0ae276686/8445162423377.jpg/600x600bb.jpg',
        youtubeId: '9GqZ5g_7a_U',
        currentVersion: 'radio',
        availableVersions: {
          radio: '9GqZ5g_7a_U',
          lyrics: '9GqZ5g_7a_U',
          original: '9GqZ5g_7a_U'
        },
        hasSyncedLyrics: true
      }
    ]
  },
  {
    id: 'rock-classics',
    name: 'Rock & Alternativo Imperecedero',
    description: 'Himnos de la historia del rock que nunca pasan de moda.',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    songs: [
      {
        id: 'yt_yellow',
        title: 'Yellow',
        artist: 'Coldplay',
        album: 'Parachutes',
        duration: 266,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/600x600bb.jpg',
        youtubeId: 'yKNxeF4KMsY',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'yKNxeF4KMsY',
          lyrics: '1G4isv_Fylg',
          original: 'yKNxeF4KMsY'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_in_the_end',
        title: 'In The End',
        artist: 'Linkin Park',
        album: 'Hybrid Theory',
        duration: 216,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/01/a7/4a01a7bb-69b7-b0a6-1e67-d86ea5242273/093624893240.jpg/600x600bb.jpg',
        youtubeId: 'eVTXPUF4Oz4',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'eVTXPUF4Oz4',
          lyrics: 'eVTXPUF4Oz4',
          original: 'eVTXPUF4Oz4'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_smells_like',
        title: 'Smells Like Teen Spirit',
        artist: 'Nirvana',
        album: 'Nevermind',
        duration: 301,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/07/04/79/0704791d-e08b-21d1-6e3e-001292026197/00720642442524.rgb.jpg/600x600bb.jpg',
        youtubeId: 'hTWKbfoikeg',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'hTWKbfoikeg',
          lyrics: 'hTWKbfoikeg',
          original: 'hTWKbfoikeg'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_bohemian',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: 354,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/eb/e6/ceebe6bb-49e0-aa31-e408-db2c13032d84/00602547202758.rgb.jpg/600x600bb.jpg',
        youtubeId: 'fJ9rUzIMcZQ',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'fJ9rUzIMcZQ',
          lyrics: 'fJ9rUzIMcZQ',
          original: 'fJ9rUzIMcZQ'
        },
        hasSyncedLyrics: true
      }
    ]
  },
  {
    id: 'chill-lofi',
    name: 'Lo-Fi Chill & Focus Beats',
    description: 'Ritmos tranquilos y cálidos para estudiar, relajarse o programar.',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    songs: [
      {
        id: 'yt_lofi_girl',
        title: 'Lofi Hip Hop Radio · Beats to Relax/Study to',
        artist: 'Lofi Girl',
        album: 'Peaceful Beats',
        duration: 300,
        coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
        youtubeId: 'jfKfPfyJRdk',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'jfKfPfyJRdk',
          lyrics: 'jfKfPfyJRdk',
          original: 'jfKfPfyJRdk'
        },
        hasSyncedLyrics: false
      },
      {
        id: 'yt_snowman',
        title: 'Snowman',
        artist: 'Sia',
        album: 'Everyday Is Christmas',
        duration: 165,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/91/97/35/919735d4-4bb1-6380-0a25-a131804f32a0/075679883582.jpg/600x600bb.jpg',
        youtubeId: 'gset79KMmt0',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'gset79KMmt0',
          lyrics: 'gset79KMmt0',
          original: 'gset79KMmt0'
        },
        hasSyncedLyrics: true
      }
    ]
  },
  {
    id: 'pop-rock-espanol',
    name: 'Clásicos Pop/Rock Español',
    description: 'Los grandes temas del pop y rock nacional: M-Clan, Fito, El Canto del Loco y más.',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    songs: [
      {
        id: 'yt_mclan_miedo',
        title: 'Miedo',
        artist: 'M-Clan',
        album: 'Definitivamente Vivo',
        duration: 278,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/74/d3/63/74d36371-a077-d6b0-7561-24ff0daae7a1/0825646194217.jpg/600x600bb.jpg',
        youtubeId: 'o_7gNZvJx1I', // M Clan Miedo - Studio audio with lyrics, zero ads
        currentVersion: 'radio',
        availableVersions: {
          radio: 'o_7gNZvJx1I',
          lyrics: 'o_7gNZvJx1I',
          original: '05lSSYQAENo'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_fito_soldadito',
        title: 'Soldadito Marinero',
        artist: 'Fito y Fitipaldis',
        album: 'Lo más lejos a tu lado',
        duration: 250,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/80/f7/a3/80f7a378-fc7b-fdb2-c15c-0bb2312675d0/825646961448.jpg/600x600bb.jpg',
        youtubeId: 'ba7_3yytb7E', // Fito y Fitipaldis - Soldadito Marinero LETRA
        currentVersion: 'radio',
        availableVersions: {
          radio: 'ba7_3yytb7E',
          lyrics: 'ba7_3yytb7E',
          original: 'ba7_3yytb7E'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_ecdl_zapatillas',
        title: 'Zapatillas',
        artist: 'El Canto del Loco',
        album: 'Zapatillas',
        duration: 172,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b4/d9/95/b4d9959f-7e0b-d278-f3d2-3bfd3f28cf69/886444474774.jpg/600x600bb.jpg',
        youtubeId: 'Oukwim3UyRs',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'Oukwim3UyRs',
          lyrics: 'Oukwim3UyRs',
          original: 'Oukwim3UyRs'
        },
        hasSyncedLyrics: true
      },
      {
        id: 'yt_pereza_princesas',
        title: 'Princesas',
        artist: 'Pereza',
        album: 'Animales',
        duration: 218,
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/05/cf/43/05cf43c6-9467-f377-61c1-4ba29e7116cb/886443657383.jpg/600x600bb.jpg',
        youtubeId: 'vtq1iD967Xw',
        currentVersion: 'radio',
        availableVersions: {
          radio: 'vtq1iD967Xw',
          lyrics: 'vtq1iD967Xw',
          original: 'vtq1iD967Xw'
        },
        hasSyncedLyrics: true
      }
    ]
  }
];
