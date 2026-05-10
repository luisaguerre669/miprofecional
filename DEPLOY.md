# 🚀 CI/CD Pipeline - Verdent

Pipeline automatizado con GitHub Actions para deploy continuo.

## 📊 Flujo de trabajo

```
git push
   ↓
GitHub Actions (CI)
   ↓
Build + tests
   ↓
Render deploy backend
   ↓
Vercel deploy frontend
   ↓
APP en producción actualizada automáticamente
```

## 🔧 Configuración necesaria

### 1. GitHub Secrets

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions

Agrega estos secrets:

#### Para Render (Backend):
- `RENDER_SERVICE_ID_BACKEND` - ID del servicio en Render
- `RENDER_API_KEY` - API key de Render
- `BACKEND_URL` - URL del backend (ej: https://miprofesional-backend.onrender.com)

#### Para Vercel (Frontend):
- `VERCEL_TOKEN` - Token de Vercel
- `VERCEL_ORG_ID` - ID de la organización
- `VERCEL_PROJECT_ID` - ID del proyecto
- `FRONTEND_URL` - URL del frontend (ej: https://miprofesional.vercel.app)

#### Variables de entorno:
- `MONGODB_URI_TEST` - URI de MongoDB para tests (opcional)
- `VITE_API_URL` - URL de la API para el frontend

### 2. Configurar Render.com

1. Crea una cuenta en https://render.com
2. Crea un nuevo Web Service
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`
5. Agrega las variables de entorno en el dashboard de Render

### 3. Configurar Vercel

1. Crea una cuenta en https://vercel.com
2. Instala Vercel CLI: `npm i -g vercel`
3. En la carpeta `frontend`, ejecuta: `vercel`
4. Sigue las instrucciones para conectar con GitHub
5. Configura las variables de entorno en el dashboard de Vercel

## 🚀 Uso

### Deploy manual:
```bash
git add .
git commit -m "Nuevos cambios"
git push origin main
```

### El pipeline automáticamente:
1. ✅ Ejecuta tests del backend
2. ✅ Ejecuta tests del frontend
3. ✅ Hace build del frontend
4. 🚀 Deploy backend a Render
5. 🚀 Deploy frontend a Vercel

## 📁 Archivos de configuración

- `.github/workflows/ci-cd.yml` - Pipeline de GitHub Actions
- `render.yaml` - Configuración de Render
- `vercel.json` - Configuración de Vercel

## 🐛 Troubleshooting

### Si el deploy falla:

1. Revisa los logs en GitHub Actions
2. Verifica que los secrets estén configurados correctamente
3. Asegúrate de que las variables de entorno estén en Render/Vercel

### Para forzar un redeploy:

```bash
git commit --allow-empty -m "🔄 Redeploy"
git push
```

## 📚 Documentación adicional

- [GitHub Actions](https://docs.github.com/en/actions)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
