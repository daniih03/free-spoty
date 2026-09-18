# 🎧 Free-Spoty Audio Engine (Backend Proxy)

Micro-servicio de backend para transmitir audio de YouTube Music de forma directa, nativa y con **0 anuncios** para la web **Free-Spoty**.

---

## 🚀 Despliegue Gratuito en 1 Minuto (en Render.com)

1. Entra en [Render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Selecciona tu repositorio: `daniih03/free-spoty`.
4. Configura estos sencillos campos:
   - **Name:** `free-spoty-api` (o el nombre que quieras)
   - **Root Directory:** `server`
   - **Language / Runtime:** `Docker` (seleccionará automáticamente el `Dockerfile` optimizado con `yt-dlp`).
   - **Instance Type:** `Free` (0 €/mes).
5. Haz clic en **Create Web Service**.
6. En 2 minutos Render te dará tu URL pública, por ejemplo:
   `https://free-spoty-api.onrender.com`

---

## 🔗 Conexión con Free-Spoty

Pega esa URL en Free-Spoty (en el modal de Ajustes / Ecualizador, o en la variable de entorno `VITE_STREAM_API_URL`).

¡Y listo! Todas las canciones se reproducirán al instante en cualquier móvil y ordenador con **CERO anuncios garantizado**.
