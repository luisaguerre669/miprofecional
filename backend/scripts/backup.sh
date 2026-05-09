#!/bin/bash

# 🗄️ SCRIPT DE BACKUP AUTOMÁTICO - MIPROFESIONAL
# Ejecutar: ./scripts/backup.sh

set -e  # Detener si hay errores

echo "🗄️ INICIANDO BACKUP AUTOMÁTICO - MIPROFESIONAL"
echo "============================================="

# 📋 Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="miprofesional_backup_${TIMESTAMP}.gz"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"
RETENTION_DAYS=30

# 🎯 Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 📁 Crear directorio de backups
echo -e "${BLUE}📁 Creando directorio de backups...${NC}"
mkdir -p "$BACKUP_DIR"

# 📋 Iniciar log
echo "Backup iniciado: $(date)" > "$LOG_FILE"

# 🗄️ Backup de MongoDB
echo -e "${BLUE}🗄️ Creando backup de MongoDB...${NC}"
if [ -n "$MONGO_URI" ]; then
    if mongodump --uri="$MONGO_URI" --gzip --archive="${BACKUP_DIR}/${BACKUP_FILE}" >> "$LOG_FILE" 2>&1; then
        echo -e "${GREEN}✅ Backup MongoDB creado: ${BACKUP_DIR}/${BACKUP_FILE}${NC}"
        echo "Backup MongoDB exitoso: ${BACKUP_FILE}" >> "$LOG_FILE"
    else
        echo -e "${RED}❌ Error en backup MongoDB${NC}"
        echo "ERROR: Backup MongoDB fallido" >> "$LOG_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ MONGO_URI no configurado${NC}"
    echo "ERROR: MONGO_URI no configurado" >> "$LOG_FILE"
    exit 1
fi

# 📦 Backup de archivos importantes
echo -e "${BLUE}📦 Creando backup de archivos...${NC}"
FILES_BACKUP="${BACKUP_DIR}/files_backup_${TIMESTAMP}.tar.gz"

# Lista de archivos y directorios a respaldar
FILES_TO_BACKUP=(
    "src/"
    "package.json"
    "package-lock.json"
    ".env.production"
    "scripts/"
    "README-*.md"
)

tar -czf "$FILES_BACKUP" "${FILES_TO_BACKUP[@]}" >> "$LOG_FILE" 2>&1
echo -e "${GREEN}✅ Backup archivos creado: ${FILES_BACKUP}${NC}"
echo "Backup archivos exitoso: ${FILES_BACKUP}" >> "$LOG_FILE"

# 🗑️ Limpieza de backups antiguos
echo -e "${BLUE}🗑️ Limpiando backups antiguos...${NC}"
DELETED_COUNT=0

# Buscar y eliminar backups más antiguos que RETENTION_DAYS
while IFS= read -r -d '' file; do
    echo "Eliminando backup antiguo: $file" >> "$LOG_FILE"
    rm "$file"
    ((DELETED_COUNT++))
done < <(find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -print0)

if [ $DELETED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ Eliminados ${DELETED_COUNT} backups antiguos${NC}"
    echo "Eliminados ${DELETED_COUNT} backups antiguos" >> "$LOG_FILE"
else
    echo -e "${YELLOW}⚠️ No se encontraron backups antiguos para eliminar${NC}"
fi

# 📊 Estadísticas del backup
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
FILES_SIZE=$(du -h "$FILES_BACKUP" | cut -f1)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo -e "${BLUE}📊 Estadísticas del backup:${NC}"
echo -e "   🗄️ MongoDB: ${BACKUP_SIZE}"
echo -e "   📦 Archivos: ${FILES_SIZE}"
echo -e "   📁 Total backups: ${TOTAL_SIZE}"

# 🧪 Verificación del backup
echo -e "${BLUE}🧪 Verificando integridad del backup...${NC}"
if gzip -t "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup MongoDB verificado${NC}"
    echo "Backup MongoDB verificado" >> "$LOG_FILE"
else
    echo -e "${RED}❌ Backup MongoDB corrupto${NC}"
    echo "ERROR: Backup MongoDB corrupto" >> "$LOG_FILE"
    exit 1
fi

if tar -tzf "$FILES_BACKUP" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backup archivos verificado${NC}"
    echo "Backup archivos verificado" >> "$LOG_FILE"
else
    echo -e "${RED}❌ Backup archivos corrupto${NC}"
    echo "ERROR: Backup archivos corrupto" >> "$LOG_FILE"
    exit 1
fi

# 📧 Notificación (opcional)
echo -e "${BLUE}📧 Enviando notificación...${NC}"
NOTIFICATION_MSG="🗄️ Backup MiProfesional completado

📅 Fecha: $(date)
🗄️ MongoDB: ${BACKUP_SIZE} (${BACKUP_FILE})
📦 Archivos: ${FILES_SIZE}
📁 Total: ${TOTAL_SIZE}
🗑️ Eliminados: ${DELETED_COUNT} archivos antiguos

📋 Log: ${LOG_FILE}"

if [ -n "$ADMIN_EMAIL" ] && command -v mail &> /dev/null; then
    echo "$NOTIFICATION_MSG" | mail -s "Backup Completado - MiProfesional" "$ADMIN_EMAIL"
    echo -e "${GREEN}✅ Notificación enviada a ${ADMIN_EMAIL}${NC}"
else
    echo -e "${YELLOW}⚠️ No se pudo enviar notificación (email no configurado)${NC}"
fi

# 📋 Resumen final
echo -e "${GREEN}🎉 BACKUP COMPLETADO EXITOSAMENTE${NC}"
echo "============================================="
echo -e "${BLUE}📊 Resumen del Backup:${NC}"
echo -e "   📅 Timestamp: ${TIMESTAMP}"
echo -e "   🗄️ MongoDB: ${BACKUP_DIR}/${BACKUP_FILE} (${BACKUP_SIZE})"
echo -e "   📦 Archivos: ${FILES_BACKUP} (${FILES_SIZE})"
echo -e "   📋 Log: ${LOG_FILE}"
echo -e "   🗑️ Eliminados: ${DELETED_COUNT} archivos antiguos"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "   • Ver backup: ls -la ${BACKUP_DIR}/"
echo -e "   • Restaurar: mongorestore --uri=\"\$MONGO_URI\" --gzip --archive=\"${BACKUP_DIR}/${BACKUP_FILE}\""
echo -e "   • Ver log: cat ${LOG_FILE}"

# Guardar resumen en log
echo "Backup completado exitosamente" >> "$LOG_FILE"
echo "Resumen: MongoDB(${BACKUP_SIZE}) + Archivos(${FILES_SIZE})" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"

echo -e "${GREEN}✅ ¡Backup completado y verificado!${NC}"
