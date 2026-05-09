#!/bin/bash

# 🗂️ SCRIPT DE ORGANIZACIÓN DEL PROYECTO MIPROFESIONAL
# Ejecutar: ./scripts/organizar-proyecto.sh

set -e  # Detener si hay errores

echo "🗂️ INICIANDO ORGANIZACIÓN DEL PROYECTO"
echo "======================================"

# 📋 Variables
PROJECT_ROOT="$(pwd)"
BACKUP_DIR="./backup-$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 🎯 Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 📁 Crear backup antes de organizar
echo -e "${BLUE}📁 Creando backup del proyecto actual...${NC}"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✅ Backup creado: $BACKUP_DIR${NC}"

# 🗑️ FASE 1: ELIMINAR ARCHIVOS DUPLICADOS
echo -e "${BLUE}🗑️ FASE 1: Eliminando archivos duplicados...${NC}"

# Archivos de servidor duplicados
echo -e "${YELLOW}   • Eliminando archivos server duplicados...${NC}"
files_to_remove=(
    "MiProfesional/backend/src/server-production.js"
    "MiProfesional/backend/src/server-modular.js"
    "MiProfesional/backend/src/render-deploy.js"
    "MiProfesional/www/server.js"
    "MiProfesional/www/server-simple.js"
    "MiProfesional/www/server.cjs"
)

for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}     Eliminando: $file${NC}"
        mv "$file" "$BACKUP_DIR/removed-files/"
    else
        echo -e "${YELLOW}     No encontrado: $file${NC}"
    fi
done

# 🗑️ FASE 2: ELIMINAR CARPETAS INNECESARIAS
echo -e "${BLUE}🗑️ FASE 2: Eliminando carpetas innecesarias...${NC}"

folders_to_remove=(
    "MiProfesionalApp"
    ".sixth"
)

for folder in "${folders_to_remove[@]}"; do
    if [ -d "$folder" ]; then
        echo -e "${YELLOW}   • Moviendo a backup: $folder${NC}"
        mv "$folder" "$BACKUP_DIR/removed-folders/"
    else
        echo -e "${YELLOW}   • No encontrada: $folder${NC}"
    fi
done

# 🔄 FASE 3: ESTANDARIZAR EXTENSIONES
echo -e "${BLUE}🔄 FASE 3: Estandarizando extensiones (.ts → .js)...${NC}"

# Convertir archivos .ts a .js en backend
ts_files=(
    "MiProfesional/backend/src/controllers/adminController.ts"
    "MiProfesional/backend/src/controllers/analyticsController.ts"
    "MiProfesional/backend/src/controllers/identityController.ts"
    "MiProfesional/backend/src/controllers/subscriptionController.ts"
    "MiProfesional/backend/src/controllers/mercadopagoController.ts"
    "MiProfesional/backend/src/models/Analytics.ts"
    "MiProfesional/backend/src/models/IdentityVerification.ts"
    "MiProfesional/backend/src/models/Subscription.ts"
    "MiProfesional/backend/src/models/Config.ts"
    "MiProfesional/backend/src/routes/admin.ts"
    "MiProfesional/backend/src/routes/analytics.ts"
    "MiProfesional/backend/src/routes/identity.ts"
    "MiProfesional/backend/src/routes/subscription.ts"
    "MiProfesional/backend/src/routes/mercadopago.ts"
)

for ts_file in "${ts_files[@]}"; do
    if [ -f "$ts_file" ]; then
        js_file="${ts_file%.ts}.js"
        echo -e "${YELLOW}   • Convirtiendo: $ts_file → $js_file${NC}"
        mv "$ts_file" "$js_file"
    fi
done

# 📁 FASE 4: CREAR ESTRUCTURA FRONTEND
echo -e "${BLUE}📁 FASE 4: Creando estructura frontend...${NC}"

# Crear estructura frontend
mkdir -p frontend/src/{pages,components/{common,forms,layout},hooks,services,utils,styles}
mkdir -p frontend/public/{assets,images}

# Mover archivos estáticos a frontend
if [ -d "MiProfesional/www" ]; then
    echo -e "${YELLOW}   • Moviendo archivos estáticos a frontend...${NC}"
    cp -r MiProfesional/www/assets/* frontend/public/assets/ 2>/dev/null || true
    cp MiProfesional/www/index.html frontend/public/ 2>/dev/null || true
    cp MiProfesional/www/terms.html frontend/public/ 2>/dev/null || true
fi

# 📱 FASE 5: CREAR ESTRUCTURA MOBILE
echo -e "${BLUE}📱 FASE 5: Completando estructura mobile...${NC}"

# Crear estructura mobile
mkdir -p mobile/src/{screens,components/{common,forms},navigation,services,hooks,utils,assets}

# Crear archivos básicos mobile
cat > mobile/src/screens/LoginScreen.js << 'EOF'
// 📱 Login Screen - MiProfesional Mobile
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const LoginScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MiProfesional</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
      />
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2563eb',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
EOF

cat > mobile/src/screens/HomeScreen.js << 'EOF'
// 📱 Home Screen - MiProfesional Mobile
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const categories = [
    { id: 1, name: 'Plomería', icon: '🔧' },
    { id: 2, name: 'Electricidad', icon: '⚡' },
    { id: 3, name: 'Construcción', icon: '🏗️' },
    { id: 4, name: 'Pintura', icon: '🎨' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>MiProfesional</Text>
      <Text style={styles.subtitle}>Encuentra profesionales cerca de ti</Text>
      
      <View style={styles.searchContainer}>
        <Text style={styles.searchText}>🔍 Buscar servicios...</Text>
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categorías</Text>
        {categories.map(category => (
          <TouchableOpacity 
            key={category.id}
            style={styles.categoryItem}
            onPress={() => console.log('Category pressed:', category.name)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  searchContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchText: {
    color: '#999',
    fontSize: 16,
  },
  categoriesContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  categoryItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default HomeScreen;
EOF

# 📁 FASE 6: CONSOLIDAR DOCUMENTACIÓN
echo -e "${BLUE}📁 FASE 6: Consolidando documentación...${NC}"

# Crear carpeta docs
mkdir -p docs

# Mover archivos de documentación
doc_files=(
    "MiProfesional/README.md"
    "MiProfesional/CHANGELOG.md"
    "MiProfesional/DEPLOYMENT.md"
    "MiProfesional/TESTING.md"
    "MiProfesional/SETUP_COMPLETE.md"
    "MiProfesional/QUICKSTART.md"
    "MiProfesional/INDEX.md"
    "MiProfesional/PROJECT_SUMMARY.txt"
    "MiProfesional/backend/README-AUTH-SERVICE.md"
    "MiProfesional/backend/README-STRANGLER.md"
    "MiProfesional/backend/SECURITY_SUMMARY.md"
    "MiProfesional/backend/VERIFICATION_SYSTEM_DOCUMENTATION.md"
    "MiProfesional/backend/CLOUD_DEPLOYMENT_SUMMARY.md"
    "MiProfesional/backend/DEPLOY_GUIDE.md"
    "MiProfesional/backend/MONGODB_DIAGNOSTIC_REPORT.md"
    "MiProfesional/backend/PRODUCTION_READINESS_REPORT.md"
)

for doc_file in "${doc_files[@]}"; do
    if [ -f "$doc_file" ]; then
        filename=$(basename "$doc_file")
        echo -e "${YELLOW}   • Moviendo: $doc_file → docs/$filename${NC}"
        mv "$doc_file" "docs/$filename"
    fi
done

# 📄 FASE 7: CREAR PACKAGE.JSON FRONTEND
echo -e "${BLUE}📄 FASE 7: Creando package.json para frontend...${NC}"

cat > frontend/package.json << 'EOF'
{
  "name": "miprofesional-frontend",
  "version": "1.0.0",
  "description": "Frontend web para MiProfesional",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next export"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# 📄 FASE 8: ACTUALIZAR .GITIGNORE
echo -e "${BLUE}📄 FASE 8: Actualizando .gitignore...${NC}"

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Backup files
backup-*/
*.backup

# Temporary files
tmp/
temp/
EOF

# 🧹 FASE 9: LIMPIEZA FINAL
echo -e "${BLUE}🧹 FASE 9: Limpieza final...${NC}"

# Eliminar carpetas vacías
find . -type d -empty -delete 2>/dev/null || true

# Eliminar archivos temporales
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.temp" -delete 2>/dev/null || true

# 📊 RESUMEN FINAL
echo -e "${GREEN}🎉 ORGANIZACIÓN COMPLETADA${NC}"
echo "======================================"
echo -e "${BLUE}📁 Estructura creada:${NC}"
echo -e "   📁 backend/ - Backend Node.js organizado"
echo -e "   📁 frontend/ - Frontend React/Next.js"
echo -e "   📁 mobile/ - Mobile React Native"
echo -e "   📁 docs/ - Documentación centralizada"
echo -e "   📁 scripts/ - Scripts de automatización"
echo ""
echo -e "${BLUE}🗑️ Archivos eliminados/organizados:${NC}"
echo -e "   • Server files duplicados"
echo -e "   • Carpetas innecesarias"
echo -e "   • Extensiones .ts estandarizadas"
echo -e "   • Documentación consolidada"
echo ""
echo -e "${BLUE}📦 Backup guardado en:${NC}"
echo -e "   $BACKUP_DIR"
echo ""
echo -e "${GREEN}✅ Proyecto organizado y listo para desarrollo!${NC}"
echo ""
echo -e "${YELLOW}🎯 Próximos pasos recomendados:${NC}"
echo -e "   1. Revisar la estructura organizada"
echo -e "   2. Iniciar desarrollo frontend (cd frontend && npm install)"
echo -e "   3. Completar app mobile (cd mobile && npm run android)"
echo -e "   4. Test de integración completa"
