# 🎵 Platino

Una alternativa web fluida, profesional y gratuita a **Spotify** y **Apple Music**, lista para ejecutarse directamente desde **GitHub Pages** sin servidores de pago ni anuncios intrusivos.

![Platino Preview](https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80)

---

## 🚀 ¿Por qué Platino? (Problemas resueltos de Spotify y Apple Music)

Platino fue creado para solucionar las mayores frustraciones que tienen los usuarios de las plataformas de streaming actuales:

1. **🎧 Audio Master de YouTube Music (Topic / Studio Master)**:
   - El gran problema de escuchar música en YouTube tradicional son los videoclips con 2 minutos de introducción dramática, diálogos de actores, ruidos de sirenas o silencios.
   - **Prioridad inteligente**: Platino busca y reproduce directamente la **pista oficial de YouTube Music** (Topic Channel subido por discográficas), idéntica a la que se escucha en Spotify/Apple Music con audio master de estudio.
   - El resolver ordena los candidatos por **duración oficial** (iTunes) para evitar intros, "Extended Edits" o bucles, y si un vídeo falla prueba automáticamente la siguiente alternativa.

2. **🚫 Cero Anuncios y Saltos Ilimitados**:
   - Sin cuñas publicitarias entre canciones.
   - Salta canciones ilimitadamente hacia adelante y hacia atrás.

3. **🔀 True Shuffle (Aleatoriedad Real sin Sesgo)**:
   - Spotify repite constantemente las mismas 10-15 canciones debido a su algoritmo de sesgo de reproducción.
   - Platino implementa el algoritmo matemático **Fisher-Yates**, garantizando una distribución 100% equiprobable y sin repeticiones en tu cola.

4. **🎤 Letras Sincronizadas Estilo Apple Music (Gratis)**:
   - Letras karaoke en tiempo real potenciadas por **LRCLIB**.
   - Desplazamiento automático fluido verso a verso.
   - **Salto interactivo**: Haz clic en cualquier verso para saltar directamente a ese segundo exacto de la canción.

5. **🎚️ Ecualizador, Bass Boost y Sleep Timer**:
   - Presets de audio reales (Web Audio) al usar el servidor propio: *Plano*, *Bass Boost 💥*, *Voz Clara 🎙️*, *Electrónica ⚡*, *Acústico 🎸*.
   - Velocidad de reproducción personalizable (0.75x a 1.5x).
   - **Temporizador de apagado (*Sleep Timer*)**: fin de canción, 15m, 30m, 45m, 1h con desvanecimiento de volumen progresivo (*smooth fade-out*) durante los últimos 10 segundos.

6. **📋 Gestor de Cola que Sí Funciona**:
   - Vacía la cola restante con **1 solo clic** (la función más demandada que Spotify oculta o no tiene).
   - Reordena pistas, salta a cualquiera con un toque y añade canciones a "Reproducir siguiente".
   - La app **recuerda tu sesión**: al volver, la última canción y la cola te esperan en la misma posición.
   - Pestaña de **Historial** con las últimas 50 canciones escuchadas.

7. **📦 Importador de Spotify y Copias de Seguridad**:
   - Importa listas de reproducción de Spotify o listas de texto plano ("Artista - Canción").
   - Guarda copias de seguridad de todas tus listas, favoritos e historial en un archivo `.json` descargable y restaurable en cualquier momento.

8. **✨ Experiencia Visual Glassmorphism Fluida**:
   - Fondo dinámico reactivo con extracción del color dominante de la portada en reproducción a 60 FPS.
   - Atajos de teclado completos (`Espacio`, `J/L`, `M`, `F`, `S`, `/`).

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
| :--- | :--- |
| `Espacio` o `K` | Reproducir / Pausar |
| `J` / `L` | Rebobinar 5s / Avanzar 5s |
| `←` / `→` | Canción anterior / Siguiente |
| `↑` / `↓` | Subir / Bajar volumen (+/- 5%) |
| `M` | Silenciar / Restaurar volumen |
| `S` | Activar / Desactivar True Shuffle |
| `R` | Alternar repetición (Apagado / Toda la lista / Canción actual) |
| `F` | Abrir / Cerrar vista de Letras Karaoke a pantalla completa |
| `/` | Enfocar rápidamente la barra de búsqueda |

---

## 🛠️ Cómo Desplegar en GitHub Pages

Este proyecto ya incluye el flujo de trabajo de GitHub Actions en `.github/workflows/deploy.yml`.

Para activarlo en tu repositorio:
1. Haz push de tus cambios a la rama `main` o `master`:
   ```bash
   git add .
   git commit -m "feat: Platino initial release"
   git push origin main
   ```
2. En GitHub, entra en tu repositorio ➔ **Settings** ➔ **Pages**.
3. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
4. ¡Listo! Tu web estará disponible en `https://<tu-usuario>.github.io/platino/`.

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo con Hot Reload
npm run dev

# 3. Compilar para producción (carpeta dist/)
npm run build
```

---

## ⚖️ Licencia & Privacidad

Platino utiliza la API oficial de YouTube Iframe para la reproducción de contenido multimedia y la API abierta de LRCLIB para las letras. No almacena datos privados en servidores externos; todas las preferencias y listas se guardan localmente en el navegador del usuario (`localStorage`).
