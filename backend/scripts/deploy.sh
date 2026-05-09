#!/bin/bash

# 🚀 SCRIPT DE DEPLOY PRODUCCIÓN - MIPROFESIONAL
# Ejecutar: ./scripts/deploy.sh

set -e  # Detener si hay errores

echo "🚀 INICIANDO DEPLOY PRODUCCIÓN - MIPROFESIONAL"
echo "=================================================="

# 📋 Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="miprofesional_backup_${TIMESTAMP}.gz"

# 🎯 Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 📁 Crear directorios necesarios
echo -e "${BLUE}📁 Creando directorios necesarios...${NC}"
mkdir -p logs
mkdir -p backups
mkdir -p temp

# 🗄️ Backup de base de datos actual
echo -e "${YELLOW}🗄️ Creando backup de base de datos...${NC}"
if [ -n "$MONGO_URI" ]; then
    mongodump --uri="$MONGO_URI" --gzip --archive="${BACKUP_DIR}/${BACKUP_FILE}"
    echo -e "${GREEN}✅ Backup creado: ${BACKUP_DIR}/${BACKUP_FILE}${NC}"
else
    echo -e "${RED}❌ MONGO_URI no configurado, saltando backup${NC}"
fi

# 📦 Instalar dependencias de producción
echo -e "${BLUE}📦 Instalando dependencias de producción...${NC}"
npm ci --production

# 🔧 Verificar variables de entorno
echo -e "${BLUE}🔧 Verificando variables de entorno...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Archivo .env.production no encontrado${NC}"
    exit 1
fi

# Copiar variables de entorno
cp .env.production .env

# 🔍 Validar configuración crítica
echo -e "${BLUE}🔍 Validando configuración crítica...${NC}"
required_vars=("MONGO_URI" "JWT_SECRET" "N8N_WEBHOOK_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Variables requeridas faltantes: ${missing_vars[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno verificadas${NC}"

# 🧪 Ejecutar tests si existen
echo -e "${BLUE}🧪 Ejecutando tests...${NC}"
if [ -d "test" ] || [ -f "package.json" ] && grep -q "test" package.json; then
    npm test
    echo -e "${GREEN}✅ Tests pasados${NC}"
else
    echo -e "${YELLOW}⚠️ No se encontraron tests, saltando${NC}"
fi

# 🏥 Health check del servidor actual
echo -e "${BLUE}🏥 Verificando estado actual del servidor...${NC}"
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Servidor ya está corriendo, se detendrá para deploy${NC}"
    pkill -f "node src/server.js" || true
    sleep 5
fi

# 🚀 Iniciar servidor en modo producción
echo -e "${BLUE}🚀 Iniciando servidor en modo producción...${NC}"
NODE_ENV=production nohup node src/server.js > logs/app.log 2>&1 &
SERVER_PID=$!

# ⏳ Esperar a que el servidor inicie
echo -e "${BLUE}⏳ Esperando a que el servidor inicie...${NC}"
sleep 10

# 🏥 Verificar health check
echo -e "${BLUE}🏥 Verificando health check...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Servidor iniciado correctamente${NC}"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Error: El servidor no inició después de 30 segundos${NC}"
        echo -e "${RED}📋 Logs del servidor:${NC}"
        tail -20 logs/app.log
        exit 1
    fi
    
    sleep 1
done

# 📊 Verificar endpoints críticos
echo -e "${BLUE}📊 Verificando endpoints críticos...${NC}"
endpoints=(
    "http://localhost:3000/health"
    "http://localhost:3000/health/detailed"
    "http://localhost:3000/health/ready"
)

for endpoint in "${endpoints[@]}"; do
    if curl -f "$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $endpoint - OK${NC}"
    else
        echo -e "${RED}❌ $endpoint - ERROR${NC}"
    fi
done

# 📧 Verificar configuración de servicios
echo -e "${BLUE}📧 Verificando configuración de servicios...${NC}"
services=("N8N" "Email" "Database")

for service in "${services[@]}"; do
    case $service in
        "N8N")
            if [ -n "$N8N_WEBHOOK_URL" ]; then
                echo -e "${GREEN}✅ N8N configurado${NC}"
            else
                echo -e "${YELLOW}⚠️ N8N no configurado${NC}"
            fi
            ;;
        "Email")
            if [ -n "$SMTP_PASS" ]; then
                echo -e "${GREEN}✅ Email configurado${NC}"
            else
                echo -e "${YELLOW}⚠️ Email no configurado${NC}"
            fi
            ;;
        "Database")
            if [ -n "$MONGO_URI" ]; then
                echo -e "${GREEN}✅ Database configurada${NC}"
            else
                echo -e "${RED}❌ Database no configurada${NC}"
            fi
            ;;
    esac
done

# 📋 Información final del deploy
echo -e "${GREEN}🎉 DEPLOY COMPLETADO EXITOSAMENTE${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Información del Sistema:${NC}"
echo -e "   🌐 Servidor: http://localhost:3000"
echo -e "   🏥 Health: http://localhost:3000/health"
echo -e "   📊 Metrics: http://localhost:3000/health/metrics"
echo -e "   📋 Logs: ./logs/app.log"
echo -e "   🗄️ Backup: ${BACKUP_DIR}/${BACKUP_FILE}"
echo -e "   🆔 PID: ${SERVER_PID}"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "   • Ver logs: tail -f logs/app.log"
echo -e "   • Detener: kill ${SERVER_PID}"
echo -e "   • Reiniciar: ./scripts/deploy.sh"
echo -e "   • Health check: curl http://localhost:3000/health"

# 📧 Notificación de deploy (opcional)
if [ -n "$ADMIN_EMAIL" ] && command -v mail &> /dev/null; then
    echo "🚀 MiProfesional deploy completado exitosamente" | mail -s "Deploy Production - MiProfesional" "$ADMIN_EMAIL"
    echo -e "${GREEN}📧 Notificación enviada a ${ADMIN_EMAIL}${NC}"
fi

echo -e "${GREEN}✅ ¡Sistema listo para producción!${NC}"
