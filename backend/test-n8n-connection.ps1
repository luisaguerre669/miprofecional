# 🧪 SCRIPT DE PRUEBA DE CONEXIÓN N8N - WINDSURF INTEGRATION
# Verifica que N8N esté funcionando y listo para recibir requests

param(
    [string]$N8NUrl = "http://localhost:5678",
    [string]$BackendUrl = "http://localhost:3000",
    [string]$TestEmail = "test@miprofesional.com"
)

Write-Host "🧪 PRUEBA DE CONEXIÓN N8N - MIPROFESIONAL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# 📋 VERIFICAR PREREQUISITOS
Write-Host "📋 Verificando prerequisitos..." -ForegroundColor Yellow

# Verificar N8N
try {
    $n8nResponse = Invoke-WebRequest -Uri "$N8NUrl/healthz" -UseBasicParsing -TimeoutSec 5
    if ($n8nResponse.StatusCode -eq 200) {
        Write-Host "✅ N8N está disponible en: $N8NUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  N8N responde con código: $($n8nResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ N8N no está disponible en: $N8NUrl" -ForegroundColor Red
    Write-Host "💡 Asegúrate de que N8N esté corriendo" -ForegroundColor Cyan
    exit 1
}

# Verificar Backend
try {
    $backendResponse = Invoke-WebRequest -Uri "$BackendUrl/" -UseBasicParsing -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend está disponible en: $BackendUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend responde con código: $($backendResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend no está disponible en: $BackendUrl" -ForegroundColor Red
    Write-Host "💡 Ejecuta: npm start en el directorio backend" -ForegroundColor Cyan
    exit 1
}

# 🔍 VERIFICAR WEBHOOK
Write-Host "🔍 Verificando webhook..." -ForegroundColor Yellow

$webhookUrl = "$N8NUrl/webhook/profesional-alta"
try {
    # Intentar OPTIONS request para verificar webhook
    $webhookResponse = Invoke-WebRequest -Uri $webhookUrl -Method OPTIONS -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Webhook está disponible: $webhookUrl" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Webhook no responde (puede ser normal si está configurado solo para POST)" -ForegroundColor Yellow
}

# 📤 PROBAR REGISTRO DE PROFESIONAL
Write-Host "📤 Probando registro de profesional..." -ForegroundColor Yellow

$testData = @{
    nombre = "Juan Pérez Test"
    email = $TestEmail
    telefono = "+54 11 1234-5678"
    profesion = "Plomero Matriculado"
    categoria = "plomeria"
    experiencia = "5"
    precio_hora = "800"
    descripcion = "Profesional de prueba para verificar integración"
    disponibilidad = "flexible"
    ubicacion = "Capital Federal"
} | ConvertTo-Json -Depth 10

try {
    Write-Host "📤 Enviando POST a: $BackendUrl/api/register/register-professional" -ForegroundColor Cyan
    
    $registerResponse = Invoke-RestMethod -Uri "$BackendUrl/api/register/register-professional" -Method POST -ContentType "application/json" -Body $testData -TimeoutSec 30
    
    Write-Host "✅ Registro exitoso!" -ForegroundColor Green
    Write-Host "📋 Response:" -ForegroundColor White
    $registerResponse | Format-List
    
    if ($registerResponse.success) {
        Write-Host "🎯 Professional ID: $($registerResponse.data.professional_id)" -ForegroundColor Cyan
        Write-Host "📊 Estado: $($registerResponse.data.estado)" -ForegroundColor Cyan
        Write-Host "📈 Score Calidad: $($registerResponse.data.score_calidad)" -ForegroundColor Cyan
        
        # Verificar que se guardó en MongoDB
        Write-Host "`n🗄️  Verificando MongoDB..." -ForegroundColor Yellow
        Write-Host "💡 Revisa manualmente en MongoDB Compass o shell:" -ForegroundColor Cyan
        Write-Host "   db.professionals.find({email:'$TestEmail'})" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error en registro: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "📋 Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        Write-Host "📋 Response:" -ForegroundColor Yellow
        $_.Exception.Response.GetResponseStream() | ForEach-Object { 
            $reader = New-Object System.IO.StreamReader($_)
            $reader.ReadToEnd() | Write-Host
        }
    }
    
    Write-Host "💡 Verifica:" -ForegroundColor Cyan
    Write-Host "   • N8N esté corriendo y workflow activo" -ForegroundColor White
    Write-Host "   • Webhook URL en .env del backend" -ForegroundColor White
    Write-Host "   • Conexión a MongoDB" -ForegroundColor White
}

# 📊 VERIFICAR ESTADO DEL REGISTRO
Write-Host "`n📊 Verificando estado del registro..." -ForegroundColor Yellow

try {
    $statusResponse = Invoke-RestMethod -Uri "$BackendUrl/api/register/status/$TestEmail" -Method GET -UseBasicParsing -TimeoutSec 10
    
    Write-Host "✅ Estado obtenido:" -ForegroundColor Green
    $statusResponse.data | Format-List
    
} catch {
    Write-Host "⚠️  No se puede obtener estado: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 📈 VERIFICAR MÉTRICAS
Write-Host "`n📈 Verificando métricas del sistema..." -ForegroundColor Yellow

try {
    $metricsResponse = Invoke-RestMethod -Uri "$BackendUrl/api/register/metrics" -Method GET -UseBasicParsing -TimeoutSec 10
    
    Write-Host "✅ Métricas del sistema:" -ForegroundColor Green
    Write-Host "📊 Total profesionales: $($metricsResponse.data.total)" -ForegroundColor Cyan
    Write-Host "📊 Aprobados: $($metricsResponse.data.aprobados)" -ForegroundColor Cyan
    Write-Host "📊 Pendientes: $($metricsResponse.data.pendientes)" -ForegroundColor Cyan
    Write-Host "📊 Tasa aprobación: $($metricsResponse.data.approval_rate)%" -ForegroundColor Cyan
    
} catch {
    Write-Host "⚠️  No se pueden obtener métricas: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 🎯 RESUMEN FINAL
Write-Host "`n🎯 RESUMEN DE PRUEBA" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "🌐 N8N: $N8NUrl" -ForegroundColor Cyan
Write-Host "🌐 Backend: $BackendUrl" -ForegroundColor Cyan
Write-Host "📧 Email de prueba: $TestEmail" -ForegroundColor Cyan
Write-Host "📡 Webhook: $webhookUrl" -ForegroundColor Cyan

Write-Host "`n🔄 Comandos útiles:" -ForegroundColor Yellow
Write-Host "• Ver logs N8N: docker-compose logs -f n8n" -ForegroundColor White
Write-Host "• Reiniciar N8N: docker-compose restart n8n" -ForegroundColor White
Write-Host "• Ver workflows: $N8NUrl" -ForegroundColor White
Write-Host "• Backend logs: npm start (en directorio backend)" -ForegroundColor White

Write-Host "`n✅ ¡PRUEBA COMPLETADA!" -ForegroundColor Green
Write-Host "Si todo funciona correctamente, el sistema está listo para producción." -ForegroundColor Cyan
