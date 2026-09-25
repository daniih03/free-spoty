FROM node:20-alpine

# yt-dlp en un venv: lo usan los workers persistentes (ytdlp_worker.py) y la CLI
# de respaldo. Node (ya presente) sirve de runtime JS para las firmas de YouTube.
# No se usa ffmpeg (formatos de audio únicos, sin mezcla).
RUN apk add --no-cache python3 ca-certificates && \
    python3 -m venv /opt/ytdlp && \
    /opt/ytdlp/bin/pip install --no-cache-dir -U yt-dlp

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    YTDLP_PYTHON=/opt/ytdlp/bin/python \
    YTDLP_PATH=/opt/ytdlp/bin/yt-dlp

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY index.js ytdlp_worker.py ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "index.js"]
