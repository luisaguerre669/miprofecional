# SCRIPT DE ORGANIZACION DEL PROYECTO MIPROFESIONAL - PowerShell
# Ejecutar: .\scripts\organizar-proyecto.ps1

Write-Host "INICIANDO ORGANIZACION DEL PROYECTO" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Crear backup
Write-Host "Creando backup del proyecto actual..." -ForegroundColor Blue
$BACKUP_DIR = ".\backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
Write-Host "Backup creado: $BACKUP_DIR" -ForegroundColor Green

# Crear estructura frontend
Write-Host "Creando estructura frontend..." -ForegroundColor Blue
New-Item -ItemType Directory -Path "frontend\src\pages" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend\src\components\common" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend\src\hooks" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend\src\services" -Force | Out-Null
New-Item -ItemType Directory -Path "frontend\public\assets" -Force | Out-Null

# Crear estructura mobile
Write-Host "Creando estructura mobile..." -ForegroundColor Blue
New-Item -ItemType Directory -Path "mobile\src\screens" -Force | Out-Null
New-Item -ItemType Directory -Path "mobile\src\components\common" -Force | Out-Null
New-Item -ItemType Directory -Path "mobile\src\navigation" -Force | Out-Null
New-Item -ItemType Directory -Path "mobile\src\services" -Force | Out-Null

# Crear docs
Write-Host "Creando estructura docs..." -ForegroundColor Blue
New-Item -ItemType Directory -Path "docs" -Force | Out-Null

# Crear package.json frontend
$packageJson = @{
    name = "miprofesional-frontend"
    version = "1.0.0"
    description = "Frontend web para MiProfesional"
    scripts = @{
        dev = "next dev"
        build = "next build"
        start = "next start"
        lint = "next lint"
    }
    dependencies = @{
        next = "^14.0.0"
        react = "^18.0.0"
        "react-dom" = "^18.0.0"
        axios = "^1.6.0"
    }
}
$packageJson | ConvertTo-Json | Out-File -FilePath "frontend\package.json" -Encoding UTF8

Write-Host "ORGANIZACION COMPLETADA" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "Estructura creada:" -ForegroundColor Blue
Write-Host "   backend/ - Backend Node.js"
Write-Host "   frontend/ - Frontend React"
Write-Host "   mobile/ - Mobile React Native"
Write-Host "   docs/ - Documentacion"
Write-Host "Backup guardado en: $BACKUP_DIR" -ForegroundColor Green
