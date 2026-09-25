"""
Worker persistente de yt-dlp para el Free-Spoty Audio Engine.

Mantiene yt-dlp cargado en memoria y atiende peticiones por stdin/stdout
(una línea JSON por petición), evitando el arranque de Python + imports en
cada canción (~1-2 s en Windows).

  entrada:  {"rid": 1, "id": "VIDEO_ID"}
  salida:   {"rid": 1, "url": "https://…"}  |  {"rid": 1, "error": "…"}
"""

import json
import sys

import yt_dlp

ARGS = [
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    '--no-playlist',
    '--no-warnings',
    '--quiet',
    '--js-runtimes', 'node',
]

# parse_options traduce los flags de CLI a opciones de la API (compatible entre versiones)
opts = yt_dlp.parse_options(ARGS).ydl_opts
ydl = yt_dlp.YoutubeDL(opts)


def reply(payload):
    sys.stdout.write(json.dumps(payload) + '\n')
    sys.stdout.flush()


reply({'ready': True, 'version': yt_dlp.version.__version__})

for line in sys.stdin:
    try:
        req = json.loads(line)
    except ValueError:
        continue
    rid = req.get('rid')
    try:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={req['id']}", download=False)
        url = info.get('url') or next(
            (f['url'] for f in info.get('requested_formats') or [] if f.get('url')), None
        )
        if not url:
            raise ValueError('sin URL de audio')
        reply({'rid': rid, 'url': url})
    except Exception as exc:  # noqa: BLE001 — se devuelve el error al proceso Node
        reply({'rid': rid, 'error': str(exc)[:300]})
