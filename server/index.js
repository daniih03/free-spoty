const express = require('express');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory URL cache: videoId -> { url, expire }
const urlCache = new Map();

// Helper to get direct stream URL using yt-dlp
function getAudioStreamUrl(videoId) {
  return new Promise((resolve, reject) => {
    // Check cache (valid for 3 hours)
    const cached = urlCache.get(videoId);
    if (cached && cached.expire > Date.now()) {
      return resolve(cached.url);
    }

    const command = `yt-dlp -g -f "bestaudio[ext=m4a]/bestaudio/best" "https://www.youtube.com/watch?v=${videoId}"`;
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      const url = stdout.trim().split('\n')[0];
      if (!url) {
        return reject(new Error('No stream URL found'));
      }
      urlCache.set(videoId, { url, expire: Date.now() + 3 * 3600 * 1000 });
      resolve(url);
    });
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Welcome / Info
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Free-Spoty Audio Engine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #121212; color: #fff; padding: 2rem; }
          .card { max-width: 500px; margin: 2rem auto; background: #181818; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          h1 { color: #1ed760; margin-top: 0; }
          code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎧 Free-Spoty Audio Engine</h1>
          <p>Servidor proxy de audio activo y transmitiendo música con <strong>0 anuncios</strong>.</p>
          <p>Endpoint de streaming: <code>/api/stream?id=VIDEO_ID</code></p>
        </div>
      </body>
    </html>
  `);
});

// Stream audio endpoint with HTTP Range support for seeking
app.get('/api/stream', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' });
  }

  try {
    const audioUrl = await getAudioStreamUrl(id);
    const parsedUrl = new URL(audioUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const headers = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    const proxyReq = client.get(audioUrl, { headers }, (proxyRes) => {
      res.status(proxyRes.statusCode);

      const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
      for (const h of forwardHeaders) {
        if (proxyRes.headers[h]) {
          res.setHeader(h, proxyRes.headers[h]);
        }
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio' });
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });

  } catch (err) {
    console.warn('Stream extraction fallback to direct yt-dlp spawn:', err.message);
    const proc = spawn('yt-dlp', [
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      '-o', '-',
      '--no-playlist',
      `https://www.youtube.com/watch?v=${id}`
    ]);

    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    proc.stdout.pipe(res);

    proc.on('error', (pErr) => {
      console.error('yt-dlp spawn error:', pErr);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream extraction failed' });
      }
    });

    req.on('close', () => {
      proc.kill();
    });
  }
});

app.listen(PORT, () => {
  console.log(`Free-Spoty audio proxy server running on port ${PORT}`);
});
