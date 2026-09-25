# 🚀 Despliegue y Operaciones (CI/CD)

Compilación y despliegue automático de **Free-Spoty** en **GitHub Pages**, sistema de actualización en caliente y backend opcional.

---

## 🌐 Enlaces de Producción

- **App en vivo:** [https://daniih03.github.io/free-spoty/](https://daniih03.github.io/free-spoty/)
- **Repositorio:** `https://github.com/daniih03/free-spoty`
- **Rama de despliegue:** `main`

---

## ⚙️ Flujo de CI/CD (GitHub Actions)

`.github/workflows/deploy.yml`:

1. **Disparador:** `git push` a `main`.
2. **Entorno:** `ubuntu-latest`, Node.js 20, `npm ci`.
3. **Compilación:** `npm run build` (`tsc && vite build`).
4. **Salida:** `./dist` → `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`.
5. **Duración:** ~35-45 s desde el push.

---

## 🔄 Actualización en caliente (`version.json`)

1. **Marca única por build (automática):** `vite.config.ts` genera `BUILD_VERSION = Date.now()` y:
   - la escribe en `public/version.json` (plugin `version-generator`, solo en `build`);
   - la inyecta en el bundle como `__APP_VERSION__`.
   Ya **no hace falta** editar `version.json` a mano.
2. **Detección (`hooks/useVersionCheck.ts`):** al montar, cada 60 s y al volver a la pestaña se descarga `./version.json?_t=…` con `cache: 'no-store'`. Si difiere de `__APP_VERSION__`, hay despliegue nuevo.
3. **Aplicación sin cortar la música:** si no suena nada, recarga al instante; si está sonando, aparece el aviso "Nueva versión lista · se aplicará al pausar" y la recarga ocurre en la siguiente pausa/fin de cola. La sesión (canción, cola y posición) se guarda antes y se restaura tras recargar.

---

## 📋 Checklist para nuevos despliegues

1. **Compilar sin errores:**
   ```powershell
   npm run build
   ```
2. **Probar la build localmente** (opcional pero recomendado):
   ```powershell
   npx vite preview --port 4173
   ```
   Con `localStorage.free_spoty_debug = '1'` se ven las trazas del motor de audio.
3. **Actualizar `docs/`** con cualquier cambio de arquitectura, diseño o comportamiento.
4. **Commit y push a `main`:**
   ```powershell
   git add -A
   git commit -m "tipo: descripción clara del cambio"
   git push origin main
   ```
5. **Verificar:** sondear `https://daniih03.github.io/free-spoty/version.json` hasta ver la nueva marca.

---

## 🎧 Backend opcional (`server/`)

Proxy de audio sin anuncios con `yt-dlp` (ver `server/README.md`): streaming con `Range`, búsqueda cacheada, validación estricta de IDs y ejecución sin shell. Debe alojarse en un servicio **sin cold start**; las URLs `onrender.com` se descartan en el cliente.

```bash
cd server && docker build -t free-spoty-audio . && docker run -d -p 3000:3000 free-spoty-audio
```

Resultados de prueba local (yt-dlp 2026.08.19): primera petición de stream ~1-3 s (extracción), siguientes ~0,12 s (URL en caché hasta su `expire`), búsqueda repetida ~2 ms.
