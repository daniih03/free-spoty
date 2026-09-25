FROM node:20-alpine

# yt-dlp (zipapp) necesita python3; no se usa ffmpeg (formatos de audio únicos, sin mezcla)
RUN apk add --no-cache python3 curl ca-certificates && \
    curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY index.js ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "index.js"]
