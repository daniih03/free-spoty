'use strict';

/**
 * Platino Audio Engine — proxy de audio sin anuncios.
 *
 *   GET /api/stream?id=VIDEO_ID   → audio (m4a/webm) con soporte HTTP Range
 *   GET /api/search?q=QUERY       → [{ videoId, title, duration }]
 *   GET /api/warm?id=VIDEO_ID     → pre-extrae la URL (la siguiente canción arranca al instante)
 *   GET /health                   → estado + versión de yt-dlp
 *
 * Seguridad: yt-dlp se invoca SIEMPRE con execFile/spawn y argumentos en array
 * (nunca a través de una shell) y los IDs se validan con /^[\w-]{11}$/.
 */

const express = require('express');
const cors = require('cors');
const { execFile, spawn } = require('child_process');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const PORT = Number(process.env.PORT) || 3000;
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';
/** Python con yt_dlp instalado → workers persistentes (extracción ~3x más rápida). */
const YTDLP_PYTHON = process.env.YTDLP_PYTHON || '';
const WORKER_COUNT = Number(process.env.YTDLP_WORKERS) || 2;
const MAX_CONCURRENT_EXTRACTIONS = Number(process.env.MAX_EXTRACTIONS) || 4;
const VIDEO_ID_RE = /^[\w-]{11}$/;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const app = express();
app.disable('x-powered-by');
// Private Network Access: permite que la web en HTTPS (GitHub Pages) use un
// servidor en localhost / red local sin bloqueos de Chrome.
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});
app.use(
  cors({
    origin: '*',
    allowedHeaders: ['Range'],
    exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges', 'Content-Type'],
  })
);

// ---------------------------------------------------------------------------
// Utilidades: caché LRU con TTL, semáforo y rate-limit
// ---------------------------------------------------------------------------

class LruCache {
  constructor(max) {
    this.max = max;
    this.map = new Map();
  }
  get(key) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }
  set(key, value, ttlMs) {
    this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + ttlMs });
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }
  delete(key) {
    this.map.delete(key);
  }
}

/** Limita procesos yt-dlp simultáneos (cada uno consume ~100 MB de RAM). */
function createSemaphore(limit) {
  let active = 0;
  const waiting = [];
  return async function run(task) {
    if (active >= limit) await new Promise((resolve) => waiting.push(resolve));
    active++;
    try {
      return await task();
    } finally {
      active--;
      waiting.shift()?.();
    }
  };
}

/** Rate-limit simple por IP (ventana fija). */
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const key = req.ip;
    const count = (hits.get(key) || 0) + 1;
    hits.set(key, count);
    if (count > max) return res.status(429).json({ error: 'Too many requests' });
    next();
  };
}

const withExtractionSlot = createSemaphore(MAX_CONCURRENT_EXTRACTIONS);

// ---------------------------------------------------------------------------
// Workers persistentes de yt-dlp (ytdlp_worker.py)
// ---------------------------------------------------------------------------

class YtDlpWorker {
  constructor(python) {
    this.python = python;
    this.pending = new Map();
    this.rid = 0;
    this.ready = false;
    this.start();
  }

  start() {
    this.ready = false;
    this.proc = spawn(this.python, [require('path').join(__dirname, 'ytdlp_worker.py')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let buf = '';
    this.proc.stdout.on('data', (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.ready) {
          this.ready = true;
          ytDlpVersion = ytDlpVersion || `${msg.version} (worker)`;
          continue;
        }
        const job = this.pending.get(msg.rid);
        if (!job) continue;
        this.pending.delete(msg.rid);
        clearTimeout(job.timer);
        msg.url ? job.resolve(msg.url) : job.reject(new Error(msg.error || 'worker error'));
      }
    });
    this.proc.stderr.resume();
    this.proc.on('exit', () => {
      for (const job of this.pending.values()) job.reject(new Error('worker terminado'));
      this.pending.clear();
      if (!shuttingDown) setTimeout(() => this.start(), 1000);
    });
  }

  extract(videoId) {
    return new Promise((resolve, reject) => {
      const rid = ++this.rid;
      const timer = setTimeout(() => {
        this.pending.delete(rid);
        reject(new Error('worker timeout'));
      }, 25_000);
      this.pending.set(rid, { resolve, reject, timer });
      this.proc.stdin.write(JSON.stringify({ rid, id: videoId }) + '\n');
    });
  }

  get load() {
    return this.pending.size;
  }
}

let shuttingDown = false;
const workers = YTDLP_PYTHON ? Array.from({ length: WORKER_COUNT }, () => new YtDlpWorker(YTDLP_PYTHON)) : [];

// ---------------------------------------------------------------------------
// Resolución de URL de audio con yt-dlp
// ---------------------------------------------------------------------------

const urlCache = new LruCache(1000);
const inflight = new Map();

/** Las URLs de googlevideo caducan (param `expire`); se cachean hasta 5 min antes. */
function ttlFromUrl(url) {
  const expire = Number(new URL(url).searchParams.get('expire'));
  if (expire) return Math.max(60_000, expire * 1000 - Date.now() - 5 * 60_000);
  return 2 * 3600_000;
}

function extractAudioUrl(videoId) {
  // Worker persistente disponible → el menos cargado; si falla, CLI como respaldo
  const live = workers.filter((w) => w.ready);
  if (live.length) {
    const worker = live.reduce((a, b) => (b.load < a.load ? b : a));
    return worker.extract(videoId).catch((err) => {
      console.warn(`[worker] ${err.message} → yt-dlp CLI`);
      return extractAudioUrlCli(videoId);
    });
  }
  return extractAudioUrlCli(videoId);
}

function extractAudioUrlCli(videoId) {
  return withExtractionSlot(
    () =>
      new Promise((resolve, reject) => {
        execFile(
          YTDLP,
          [
            '-g',
            '-f',
            'bestaudio[ext=m4a]/bestaudio/best',
            '--no-warnings',
            '--no-playlist',
            // Runtime JS para descifrar firmas de YouTube (Node ya está presente)
            '--js-runtimes',
            'node',
            '--',
            `https://www.youtube.com/watch?v=${videoId}`,
          ],
          { timeout: 20_000, maxBuffer: 1024 * 1024 },
          (error, stdout, stderr) => {
            if (error) return reject(new Error((stderr || error.message).trim().slice(0, 300)));
            const url = stdout.trim().split('\n')[0];
            if (!url.startsWith('http')) return reject(new Error('yt-dlp no devolvió una URL válida'));
            resolve(url);
          }
        );
      })
  );
}

/** Devuelve la URL directa (caché → petición en vuelo compartida → yt-dlp). */
async function getAudioUrl(videoId) {
  const cached = urlCache.get(videoId);
  if (cached) return cached;
  if (inflight.has(videoId)) return inflight.get(videoId);

  const promise = extractAudioUrl(videoId)
    .then((url) => {
      urlCache.set(videoId, url, ttlFromUrl(url));
      return url;
    })
    .finally(() => inflight.delete(videoId));
  inflight.set(videoId, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

let ytDlpVersion = null;
if (!YTDLP_PYTHON) execFile(YTDLP, ['--version'], { timeout: 10_000 }, (err, out) => {
  ytDlpVersion = err ? `unavailable: ${err.message}` : out.trim();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), ytDlp: ytDlpVersion });
});

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Platino Audio Engine</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#090b10;color:#fff;padding:2rem}
.card{max-width:520px;margin:2rem auto;background:#15151c;border:1px solid rgba(255,255,255,.1);border-radius:1rem;padding:2rem}
h1{color:#ff3b24;margin-top:0}code{background:rgba(255,255,255,.08);padding:.2rem .5rem;border-radius:4px}</style></head>
<body><div class="card"><h1>🎧 Platino Audio Engine</h1>
<p>Proxy de audio activo, transmitiendo con <strong>0 anuncios</strong>.</p>
<p>Streaming: <code>/api/stream?id=VIDEO_ID</code><br>Búsqueda: <code>/api/search?q=...</code></p></div></body></html>`);
});

// Búsqueda (yt-search), cacheada 1 h
const searchCache = new LruCache(500);
let ytSearch = null;
try {
  ytSearch = require('yt-search');
} catch {
  console.warn('yt-search no instalado: /api/search devolverá resultados vacíos');
}

app.get('/api/search', rateLimit({ windowMs: 60_000, max: 90 }), async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 200);
  if (!q) return res.status(400).json({ error: 'Missing q parameter', results: [] });

  const key = q.toLowerCase();
  const cached = searchCache.get(key);
  if (cached) return res.json({ results: cached });
  if (!ytSearch) return res.json({ results: [] });

  try {
    const data = await ytSearch({ query: q, pages: 1 });
    const results = (data.videos || []).slice(0, 8).map((v) => ({
      videoId: v.videoId,
      title: v.title,
      duration: v.duration?.seconds || 0,
    }));
    searchCache.set(key, results, 3600_000);
    res.set('Cache-Control', 'public, max-age=3600').json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(502).json({ error: 'Search failed', results: [] });
  }
});

/** Proxy del audio con soporte Range (seek). Reintenta una vez si la URL caducó. */
async function proxyAudio(req, res, videoId, attempt = 0) {
  const audioUrl = await getAudioUrl(videoId);
  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const headers = { 'User-Agent': UA };
  if (req.headers.range) headers.Range = req.headers.range;

  const upstream = await fetch(audioUrl, { headers, redirect: 'follow', signal: controller.signal });

  if ((upstream.status === 403 || upstream.status === 410) && attempt === 0) {
    urlCache.delete(videoId); // URL caducada o ligada a otra IP
    upstream.body?.cancel().catch(() => {});
    return proxyAudio(req, res, videoId, 1);
  }
  if (!upstream.ok && upstream.status !== 206) {
    throw new Error(`Upstream ${upstream.status}`);
  }

  res.status(upstream.status);
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(h);
    if (value) res.setHeader(h, value);
  }
  if (!upstream.headers.get('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=3600');

  if (!upstream.body) return res.end();
  try {
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (err) {
    if (err.name !== 'AbortError' && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') throw err;
  }
}

/** Último recurso: yt-dlp descarga y emite el audio por stdout (sin Range). */
function spawnFallback(req, res, videoId) {
  const proc = spawn(YTDLP, [
    '-f',
    'bestaudio[ext=m4a]/bestaudio',
    '-o',
    '-',
    '--no-playlist',
    '--no-warnings',
    '--js-runtimes',
    'node',
    '--',
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);
  res.status(200).setHeader('Content-Type', 'audio/mp4');
  proc.stdout.pipe(res);
  proc.stderr.resume();
  proc.on('error', (err) => {
    console.error('yt-dlp spawn error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Stream extraction failed' });
    else res.end();
  });
  req.on('close', () => proc.kill('SIGKILL'));
}

app.get('/api/warm', async (req, res) => {
  const videoId = String(req.query.id || '');
  if (!VIDEO_ID_RE.test(videoId)) return res.status(400).json({ error: 'Invalid id parameter' });
  try {
    await getAudioUrl(videoId);
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.get('/api/stream', async (req, res) => {
  const videoId = String(req.query.id || '');
  if (!VIDEO_ID_RE.test(videoId)) return res.status(400).json({ error: 'Invalid id parameter' });

  try {
    await proxyAudio(req, res, videoId);
  } catch (err) {
    if (req.destroyed) return;
    console.warn(`[stream ${videoId}] ${err.message} → fallback spawn`);
    if (res.headersSent) return res.end();
    spawnFallback(req, res, videoId);
  }
});

const server = app.listen(PORT, () => {
  console.log(`Platino audio engine escuchando en :${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    shuttingDown = true;
    workers.forEach((w) => w.proc.kill());
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
