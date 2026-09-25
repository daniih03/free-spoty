# 🎧 Platino Audio Engine (Backend Proxy)

Microservicio opcional que transmite el audio de YouTube como `<audio>` HTML5 nativo, con **0 anuncios**, y además activa el ecualizador real de la app.

| Endpoint | Descripción |
| :--- | :--- |
| `GET /api/stream?id=VIDEO_ID` | Audio (m4a/webm) con soporte `Range` (seek instantáneo). |
| `GET /api/search?q=QUERY` | `{ results: [{ videoId, title, duration }] }` (caché 1 h, 90 req/min por IP). |
| `GET /api/warm?id=VIDEO_ID` | Pre-extrae la URL (la app lo usa para precargar la siguiente canción). |
| `GET /health` | Estado y versión de `yt-dlp`. |

## Características

- **Seguro:** `yt-dlp` se ejecuta con `execFile`/`spawn` y argumentos en array (sin shell); los IDs se validan con `/^[\w-]{11}$/`.
- **Workers persistentes de yt-dlp** (`ytdlp_worker.py`, si `YTDLP_PYTHON` apunta a un Python con yt-dlp): la extracción baja de ~4,5 s (yt-dlp.exe en Windows) a ~1,3 s.
- **Rápido:** caché LRU de URLs con la caducidad real de googlevideo (`expire`), deduplicación de extracciones concurrentes y límite de procesos `yt-dlp` simultáneos (`MAX_EXTRACTIONS`, por defecto 4).
- **Resiliente:** si la URL cacheada devuelve 403/410 se re-extrae una vez; como último recurso se emite el audio directamente desde `yt-dlp -o -`.
- **CORS abierto** (`*`) con cabeceras `Range` expuestas: necesario para el streaming y para el ecualizador Web Audio.

## ⚠️ Elige un hosting sin "cold start"

Los planes gratuitos que duermen el servidor (p. ej. **Render Free**) tardan 30-45 s en despertar; el navegador agota el gesto del usuario y la canción no arranca. Por eso la app **descarta automáticamente las URLs `onrender.com`** (ver `docs/troubleshooting-and-lessons.md`, lección nº4).

Opciones recomendadas: un VPS o Raspberry Pi propio, Fly.io / Railway con instancia siempre encendida, o Docker en tu PC para uso local.

## 🪟 Windows en 1 comando (recomendado)

```powershell
powershell -ExecutionPolicy Bypass -File server\start-windows.ps1 -Tunnel
```
Instala y actualiza todo, arranca el servidor y muestra el enlace + QR para conectar la app (también en el móvil). Sin `-Tunnel`, solo funciona en este PC (`http://localhost:3000`).

## 🚀 Despliegue con Docker

```bash
cd server
docker build -t platino-audio .
docker run -d --restart unless-stopped -p 3000:3000 --name platino-audio platino-audio
curl http://localhost:3000/health
```

Variables opcionales: `PORT` (3000), `MAX_EXTRACTIONS` (4), `YTDLP_PATH` (`yt-dlp`), `YTDLP_PYTHON` (activa los workers), `YTDLP_WORKERS` (2).

## 💻 Ejecución local sin Docker

Requiere Node 20+ y `yt-dlp` en el `PATH`:

```bash
cd server
npm install
npm start
```

## 🔗 Conexión con Platino

Pega la URL pública (HTTPS) en **Ajustes & Ecualizador → Servidor de audio**, o compílala en la variable `VITE_STREAM_API_URL`. Si el servidor no responde en 3,5 s, la app vuelve automáticamente al reproductor de YouTube.
