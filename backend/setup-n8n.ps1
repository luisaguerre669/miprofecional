# 🚀 SCRIPT AUTOMÁTICO DE INSTALACIÓN N8N - WINDSURF INTEGRATION
# Ejecutar: PowerShell -ExecutionPolicy Bypass -File setup-n8n.ps1

param(
    [string]$InstallPath = "D:\proyecto_verdent\n8n",
    [string]$Port = "5678",
    [string]$Username = "admin",
    [string]$Password = "miprofesional123"
)

Write-Host "🚀 INSTALACIÓN AUTOMÁTICA DE N8N - MIPROFESIONAL" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 📋 VERIFICAR PREREQUISITOS
Write-Host "📋 Verificando prerequisitos..." -ForegroundColor Yellow

# Verificar Docker
try {
    docker --version > $null 2>&1
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no encontrado. Por favor instala Docker Desktop primero." -ForegroundColor Red
    Write-Host "📥 Descarga: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    exit 1
}

# Verificar PowerShell 7+
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Host "⚠️  Se recomienda PowerShell 7+ para mejor rendimiento" -ForegroundColor Yellow
}

# 📁 CREAR DIRECTORIO DE INSTALACIÓN
Write-Host "📁 Creando directorio de instalación..." -ForegroundColor Yellow
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force
    Write-Host "✅ Directorio creado: $InstallPath" -ForegroundColor Green
} else {
    Write-Host "✅ Directorio ya existe: $InstallPath" -ForegroundColor Green
}

# 🐳 CREAR DOCKER COMPOSE
Write-Host "🐳 Creando Docker Compose configuration..." -ForegroundColor Yellow

$dockerComposeContent = @"
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: miprofesional-n8n
    restart: unless-stopped
    ports:
      - "$Port`:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=$Username
      - N8N_BASIC_AUTH_PASSWORD=$Password
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:$Port`/
      - N8N_METRICS=true
      - N8N_LOG_LEVEL=info
      - NODE_ENV=production
      - N8N_SECURE_COOKIE=false
      - N8N_DISABLE_PRODUCTION_MAIN_PROCESS=true
    volumes:
      - n8n_data:/home/node/.n8n
      - n8n_workflows:/home/node/.n8n/workflows
    networks:
      - n8n_network

  # PostgreSQL para N8N (opcional pero recomendado)
  postgres:
    image: postgres:13
    container_name: miprofesional-n8n-db
    restart: always
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n123
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n_network

volumes:
  n8n_data:
    driver: local
  n8n_workflows:
    driver: local
  postgres_data:
    driver: local

networks:
  n8n_network:
    driver: bridge
"@

$dockerComposePath = Join-Path $InstallPath "docker-compose.yml"
$dockerComposeContent | Out-File -FilePath $dockerComposePath -Encoding UTF8
Write-Host "✅ Docker Compose creado: $dockerComposePath" -ForegroundColor Green

# 📝 CREAR ARCHIVO DE ENTORNO
Write-Host "📝 Creando archivo de entorno..." -ForegroundColor Yellow

$envContent = @"
# 🔧 CONFIGURACIÓN N8N - MIPROFESIONAL
N8N_PORT=$Port
N8N_HOST=localhost
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:$Port`/
N8N_BASIC_AUTH_USER=$Username
N8N_BASIC_AUTH_PASSWORD=$Password

# 🗄️ BASE DE DATOS
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=n8n
POSTGRES_PASSWORD=n8n123
POSTGRES_DB=n8n
POSTGRES_DB_TYPE=postgresdb

# 📡 WEBHOOK CONFIGURATION
N8N_WEBHOOK_URL=http://localhost:$Port`/webhook
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
N8N_DEFAULT_LOCALE=es

# 🚀 METRICS Y LOGGING
N8N_METRICS=true
N8N_LOG_LEVEL=info
NODE_ENV=production
"@

$envPath = Join-Path $InstallPath ".env"
$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "✅ Archivo .env creado: $envPath" -ForegroundColor Green

# 🔄 CREAR SCRIPT DE IMPORTACIÓN AUTOMÁTICA
Write-Host "🔄 Creando script de importación de workflows..." -ForegroundColor Yellow

$importScriptContent = @"
# 📥 SCRIPT DE IMPORTACIÓN AUTOMÁTICA DE WORKFLOWS N8N
param(
    [string]$N8NUrl = "http://localhost:$Port",
    [string]$WorkflowPath = "..\backend\n8n-workflow-alta-profesional.json"
)

Write-Host "📥 Importando workflows a N8N..." -ForegroundColor Green

# Esperar a que N8N esté disponible
Write-Host "⏳ Esperando a que N8N esté disponible..." -ForegroundColor Yellow
$timeout = 60
$timer = 0

while ($timer -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "$N8NUrl/healthz" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ N8N está disponible" -ForegroundColor Green
            break
        }
    } catch {
        # Seguir esperando
    }
    
    Start-Sleep -Seconds 2
    $timer += 2
    Write-Host "." -NoNewline -ForegroundColor Yellow
}

if ($timer -ge $timeout) {
    Write-Host "`n❌ Timeout esperando a N8N" -ForegroundColor Red
    exit 1
}

# Verificar archivo de workflow
if (!(Test-Path $WorkflowPath)) {
    Write-Host "❌ No se encuentra el archivo de workflow: $WorkflowPath" -ForegroundColor Red
    exit 1
}

# Importar workflow usando API de N8N
try {
    $workflowContent = Get-Content $WorkflowPath -Raw
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$Username`:$Password"))
    $headers['Authorization'] = "Basic $auth"
    
    $response = Invoke-RestMethod -Uri "$N8NUrl/api/v1/workflows" -Method POST -Headers $headers -Body $workflowContent
    
    Write-Host "✅ Workflow importado exitosamente" -ForegroundColor Green
    Write-Host "📋 Workflow ID: $($response.id)" -ForegroundColor Cyan
    
    # Activar webhook automáticamente
    $webhookUrl = "$N8NUrl/webhook/profesional-alta"
    Write-Host "📡 URL del Webhook: $webhookUrl" -ForegroundColor Cyan
    
    # Actualizar .env del backend
    $backendEnvPath = "..\backend\.env"
    if (Test-Path $backendEnvPath) {
        $envContent = Get-Content $backendEnvPath
        $newEnvContent = $envContent -replace "N8N_WEBHOOK_URL=.*", "N8N_WEBHOOK_URL=$webhookUrl"
        $newEnvContent | Out-File -FilePath $backendEnvPath -Encoding UTF8
        Write-Host "✅ .env del backend actualizado" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error importando workflow: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Importa manualmente desde: $N8NUrl" -ForegroundColor Cyan
}

Write-Host "🎯 N8N listo para usar!" -ForegroundColor Green
Write-Host "🌐 URL: $N8NUrl" -ForegroundColor Cyan
Write-Host "👤 Usuario: $Username" -ForegroundColor Cyan
Write-Host "🔐 Contraseña: $Password" -ForegroundColor Cyan
"@

$importScriptPath = Join-Path $InstallPath "import-workflows.ps1"
$importScriptContent | Out-File -FilePath $importScriptPath -Encoding UTF8
Write-Host "✅ Script de importación creado: $importScriptPath" -ForegroundColor Green

# 🚀 INICIAR N8N
Write-Host "🚀 Iniciando N8N con Docker..." -ForegroundColor Yellow

Set-Location $InstallPath

try {
    docker-compose up -d
    
    Write-Host "⏳ Esperando a que N8N inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verificar que los contenedores estén corriendo
    $containers = docker-compose ps
    if ($containers -match "Up") {
        Write-Host "✅ N8N está corriendo" -ForegroundColor Green
    } else {
        Write-Host "❌ Error iniciando N8N" -ForegroundColor Red
        Write-Host "📋 Logs:" -ForegroundColor Yellow
        docker-compose logs
        exit 1
    }
    
} catch {
    Write-Host "❌ Error iniciando Docker Compose: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 📥 IMPORTAR WORKFLOWS AUTOMÁTICAMENTE
Write-Host "📥 Importando workflows automáticamente..." -ForegroundColor Yellow

try {
    & $importScriptPath
} catch {
    Write-Host "⚠️  Error en importación automática. Importa manualmente." -ForegroundColor Yellow
}

# 🎯 INFORMACIÓN FINAL
Write-Host "`n🎯 ¡N8N INSTALADO Y CONFIGURADO!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "🌐 URL de N8N: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "👤 Usuario: $Username" -ForegroundColor Cyan
Write-Host "🔐 Contraseña: $Password" -ForegroundColor Cyan
Write-Host "📁 Directorio de instalación: $InstallPath" -ForegroundColor Cyan
Write-Host "`n📡 Webhook URL: http://localhost:$Port/webhook/profesional-alta" -ForegroundColor Green
Write-Host "`n🔄 Comandos útiles:" -ForegroundColor Yellow
Write-Host "• Ver estado: docker-compose ps" -ForegroundColor White
Write-Host "• Ver logs: docker-compose logs -f" -ForegroundColor White
Write-Host "• Detener: docker-compose down" -ForegroundColor White
Write-Host "• Reiniciar: docker-compose restart" -ForegroundColor White
Write-Host "• Importar workflows: .\import-workflows.ps1" -ForegroundColor White

# 🧪 PROBAR CONEXIÓN
Write-Host "`n🧪 Probando conexión..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/healthz" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ N8N responde correctamente" -ForegroundColor Green
        
        # Actualizar .env del backend si existe
        $backendEnvPath = "..\backend\.env"
        if (Test-Path $backendEnvPath) {
            $envContent = Get-Content $backendEnvPath
            $webhookUrl = "http://localhost:$Port/webhook/profesional-alta"
            
            if ($envContent -match "N8N_WEBHOOK_URL=") {
                $newEnvContent = $envContent -replace "N8N_WEBHOOK_URL=.*", "N8N_WEBHOOK_URL=$webhookUrl"
            } else {
                $newEnvContent = $envContent + "`nN8N_WEBHOOK_URL=$webhookUrl"
            }
            
            $newEnvContent | Out-File -FilePath $backendEnvPath -Encoding UTF8
            Write-Host "✅ .env del backend actualizado con webhook URL" -ForegroundColor Green
        }
        
    } else {
        Write-Host "⚠️  N8N responde pero con código: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se puede conectar a N8N aún. Espera unos segundos más." -ForegroundColor Yellow
}

Write-Host "`n🚀 ¡LISTO PARA USAR CON WINDSURF!" -ForegroundColor Green
Write-Host "Ahora puedes hacer POST a: http://localhost:3000/api/register/register-professional" -ForegroundColor Cyan
