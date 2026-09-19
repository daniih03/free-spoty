# 🚀 Despliegue y Operaciones (CI/CD)

Este documento detalla el flujo de integración continua, compilación y despliegue automático de **Free-Spoty** en **GitHub Pages**, así como el sistema de actualización en caliente para usuarios activos.

---

## 🌐 Enlaces de Producción

- **URL de la Aplicación en Vivo:** [https://daniih03.github.io/free-spoty/](https://daniih03.github.io/free-spoty/)
- **Repositorio de GitHub:** `https://github.com/daniih03/free-spoty`
- **Rama de Despliegue:** `main`

---

## ⚙️ Flujo de CI/CD (GitHub Actions)

El archivo `.github/workflows/deploy.yml` orquesta la compilación y publicación automática:

1. **Disparador:** Cualquier `git push` a la rama `main` activa el workflow.
2. **Entorno de Compilación:** `ubuntu-latest` con Node.js v20.
3. **Comando de Compilación:** `npm run build` (`tsc && vite build`).
4. **Destino de Salida:** `./dist`.
5. **Publicación:** Mediante las acciones oficiales `actions/upload-pages-artifact@v3` y `actions/deploy-pages@v4`.
6. **Tiempo Estimado de Despliegue:** ~35-45 segundos desde el push.

---

## 🔄 Sistema de Actualización en Caliente (`version.json`)

Para evitar que los usuarios mantengan en memoria versiones desactualizadas con código o cachés obsoletas, la aplicación cuenta con un mecanismo de detección de nuevas versiones:

1. **Archivo de Control (`public/version.json`):**
   ```json
   {
     "version": 1789813707403
   }
   ```
2. **Detección en el Cliente (`src/components/Layout/Header.tsx`):**
   - Cada 60 segundos (y al montar la aplicación), el cliente realiza una petición `fetch('/free-spoty/version.json?t=' + Date.now())` con cabecera `cache: 'no-store'`.
   - Si la versión remota es mayor a la versión con la que se compiló el bundle, la aplicación avisa o recarga automáticamente los activos para aplicar los cambios sin intervención manual del usuario.

---

## 📋 Checklist Obligatorio para Nuevos Despliegues

Antes de dar por concluida cualquier modificación en el código:

1. **Verificar Compilación TypeScript y Vite:**
   ```powershell
   npm run build
   ```
   *Debe terminar con 0 errores (`✓ built in ...`).*

2. **Actualizar la Marca de Tiempo en `public/version.json`:**
   Obtener el timestamp actual con Node:
   ```javascript
   node -e "console.log(Date.now())"
   ```
   Escribir el valor resultante en `public/version.json`.

3. **Recompilar para Inyectar la Nueva Versión en `dist`:**
   ```powershell
   npm run build
   ```

4. **Hacer Commit y Push a `main`:**
   ```powershell
   git add -A
   git commit -m "tipo: descripción clara del cambio"
   git push origin main
   ```

5. **Verificar Despliegue en GitHub Pages:**
   Realizar sondeo a `https://daniih03.github.io/free-spoty/version.json` hasta que devuelva la nueva versión.
