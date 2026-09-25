import { consumeServerLinkParam } from './services/config';

// Se importa lo primero en main.tsx: el enlace ?server= debe guardarse antes de
// que el motor de audio arranque y decida si carga el reproductor de YouTube.
consumeServerLinkParam();
