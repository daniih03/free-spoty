'use strict';

/**
 * Verifica y regenera los IDs de vídeo de las playlists destacadas
 * (src/services/exploreData.ts).
 *
 *   node scripts/verify-featured.js          → informe
 *   node scripts/verify-featured.js --write  → reescribe los IDs inválidos
 *
 * Un ID es válido si existe (oEmbed 200) y su título contiene el nombre de la
 * canción. Los reemplazos salen de yt-search, filtrados por título y por una
 * duración a ±15 s de la oficial; se prioriza "Official Audio"/"Topic".
 */

const fs = require('fs');
const path = require('path');
const ytSearch = require('yt-search');

const FILE = path.resolve(__dirname, '../../src/services/exploreData.ts');
const WRITE = process.argv.includes('--write');

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function oembedTitle(id) {
  const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
  if (!res.ok) return null;
  const d = await res.json();
  return `${d.title} ${d.author_name}`;
}

function matches(videoTitle, songTitle) {
  const core = norm(songTitle).split(':')[0];
  return norm(videoTitle).includes(core);
}

async function findReplacements(title, artist, duration) {
  const { videos } = await ytSearch(`${artist} ${title} official audio`);
  const score = (v) => (/official audio|topic|audio oficial/i.test(`${v.title} ${v.author?.name}`) ? 0 : 1);
  return videos
    .filter((v) => matches(v.title, title))
    .filter((v) => !duration || !v.seconds || Math.abs(v.seconds - duration) <= 15)
    .sort((a, b) => score(a) - score(b))
    .slice(0, 2)
    .map((v) => v.videoId);
}

(async () => {
  let src = fs.readFileSync(FILE, 'utf8');
  const chunks = src.split(/(?=\{\s*id: 'yt_)/).slice(1);
  let fixed = 0;

  for (const chunk of chunks) {
    const title = chunk.match(/title: '((?:[^'\\]|\\.)*)'/)[1].replace(/\\'/g, "'");
    const artist = chunk.match(/artist: '((?:[^'\\]|\\.)*)'/)[1].replace(/\\'/g, "'");
    const duration = Number(chunk.match(/duration: (\d+)/)?.[1] || 0);
    const ids = [...new Set([...(chunk.match(/candidateVideoIds: \[([^\]]*)\]/)?.[1].match(/'([^']+)'/g) || [])].map((x) => x.slice(1, -1)))];
    const primary = chunk.match(/youtubeId: '([^']*)'/)[1];
    if (!ids.includes(primary)) ids.unshift(primary);

    const valid = [];
    for (const id of ids) {
      const t = await oembedTitle(id);
      if (t && matches(t, title)) valid.push(id);
    }

    if (valid.length === ids.length) {
      console.log(`✓ ${title} — ${artist}`);
      continue;
    }

    const extra = (await findReplacements(title, artist, duration)).filter((id) => !valid.includes(id));
    const next = [...extra, ...valid].slice(0, 3);
    console.log(`✗ ${title} — ${artist}: [${ids.join(', ')}] → [${next.join(', ')}]`);
    if (!WRITE || next.length === 0) continue;

    let updated = chunk
      .replace(/youtubeId: '[^']*'/, `youtubeId: '${next[0]}'`)
      .replace(/candidateVideoIds: \[[^\]]*\]/, `candidateVideoIds: [${next.map((i) => `'${i}'`).join(', ')}]`);
    updated = updated.replace(/availableVersions: \{[^}]*\}/, `availableVersions: {\n          radio: '${next[0]}',\n          lyrics: '${next[1] || next[0]}',\n          original: '${next[2] || next[0]}'\n        }`);
    src = src.replace(chunk, updated);
    fixed++;
  }

  if (WRITE) {
    fs.writeFileSync(FILE, src);
    console.log(`\n${fixed} canciones actualizadas en exploreData.ts`);
  }
})();
