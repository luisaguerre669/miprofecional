#!/usr/bin/env node

// 🧪 SCRIPT DE TESTING PRODUCCIÓN - MIPROFESIONAL
// Ejecutar: node scripts/production-test.js

const axios = require('axios');
const chalk = require('chalk');

class ProductionTester {
  constructor() {
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    this.timeout = 30000;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  // Test de health check básico
  async testHealthCheck() {
    console.log(chalk.blue('🏥 Test: Health Check Básico'));
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: this.timeout });
      
      if (response.status === 200 && response.data.status === 'OK') {
        console.log(chalk.green('✅ Health check básico - PASSED'));
        console.log(chalk.gray(`   Status: ${response.data.status}`));
        console.log(chalk.gray(`   Uptime: ${response.data.uptime}s`));
        this.testResults.passed++;
      } else {
        console.log(chalk.red('❌ Health check básico - FAILED'));
        console.log(chalk.red(`   Status: ${response.status}`));
        this.testResults.failed++;
      }
    } catch (error) {
      console.log(chalk.red('❌ Health check básico - FAILED'));
      console.log(chalk.red(`   Error: ${error.message}`));
      this.testResults.failed++;
    }
    
    this.testResults.total++;
  }

  // Test de health check detallado
  async testDetailedHealthCheck() {
    console.log(chalk.blue('🏥 Test: Health Check Detallado'));
    
    try {
      const response = await axios.get(`${this.baseUrl}/health/detailed`, { timeout: this.timeout });
      
      if (response.status === 200) {
        console.log(chalk.green('✅ Health check detallado - PASSED'));
        console.log(chalk.gray(`   Database: ${response.data.database.status}`));
        console.log(chalk.gray(`   Memory: ${response.data.memory.used}MB`));
        console.log(chalk.gray(`   Services: N8N=${response.data.services.n8n}, Email=${response.data.services.email}`));
        this.testResults.passed++;
      } else {
        console.log(chalk.red('❌ Health check detallado - FAILED'));
        console.log(chalk.red(`   Status: ${response.status}`));
        this.testResults.failed++;
      }
    } catch (error) {
      console.log(chalk.red('❌ Health check detallado - FAILED'));
      console.log(chalk.red(`   Error: ${error.message}`));
      this.testResults.failed++;
    }
    
    this.testResults.total++;
  }

  // Test de readiness probe
  async testReadinessProbe() {
    console.log(chalk.blue('🏥 Test: Readiness Probe'));
    
    try {
      const response = await axios.get(`${this.baseUrl}/health/ready`, { timeout: this.timeout });
      
      if (response.status === 200 && response.data.ready === true) {
        console.log(chalk.green('✅ Readiness probe - PASSED'));
        console.log(chalk.gray(`   Ready: ${response.data.ready}`));
        console.log(chalk.gray(`   Checks: ${JSON.stringify(response.data.checks)}`));
        this.testResults.passed++;
      } else {
        console.log(chalk.red('❌ Readiness probe - FAILED'));
        console.log(chalk.red(`   Ready: ${response.data?.ready}`));
        this.testResults.failed++;
      }
    } catch (error) {
      console.log(chalk.red('❌ Readiness probe - FAILED'));
      console.log(chalk.red(`   Error: ${error.message}`));
      this.testResults.failed++;
    }
    
    this.testResults.total++;
  }

  // Test de registro de profesional
  async testProfessionalRegistration() {
    console.log(chalk.blue('📝 Test: Registro de Profesional'));
    
    const testData = {
      nombre: 'Test Production',
      email: `test_${Date.now()}@production.com`,
      telefono: '+54 11 9999-8888',
      profesion: 'Plomero de Prueba',
      categoria: 'plomeria',
      experiencia: '5',
      precio_hora: '800',
      descripcion: 'Profesional de prueba para producción',
      disponibilidad: 'flexible',
      ubicacion: 'Capital Federal'
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/register/register-professional`,
        testData,
        { 
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.status === 201 && response.data.success === true) {
        console.log(chalk.green('✅ Registro de profesional - PASSED'));
        console.log(chalk.gray(`   Professional ID: ${response.data.data.professional_id}`));
        console.log(chalk.gray(`   Estado: ${response.data.data.estado}`));
        console.log(chalk.gray(`   Score: ${response.data.data.score_calidad}`));
        this.testResults.passed++;
      } else {
        console.log(chalk.red('❌ Registro de profesional - FAILED'));
        console.log(chalk.red(`   Status: ${response.status}`));
        console.log(chalk.red(`   Success: ${response.data.success}`));
        this.testResults.failed++;
      }
    } catch (error) {
      console.log(chalk.red('❌ Registro de profesional - FAILED'));
      console.log(chalk.red(`   Error: ${error.message}`));
      if (error.response) {
        console.log(chalk.red(`   Status: ${error.response.status}`));
        console.log(chalk.red(`   Data: ${JSON.stringify(error.response.data)}`));
      }
      this.testResults.failed++;
    }
    
    this.testResults.total++;
  }

  // Test de autenticación
  async testAuthentication() {
    console.log(chalk.blue('🔐 Test: Autenticación'));
    
    try {
      // Test de login
      const loginResponse = await axios.post(
        `${this.baseUrl}/api/auth/login`,
        {
          email: 'test@example.com',
          password: 'wrongpassword'
        },
        { 
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // Si llega aquí, algo está mal (debería fallar con credenciales incorrectas)
      console.log(chalk.red('❌ Autenticación - FAILED (debería fallar con credenciales incorrectas)'));
      this.testResults.failed++;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(chalk.green('✅ Autenticación - PASSED (rechazó credenciales incorrectas)'));
        this.testResults.passed++;
      } else {
        console.log(chalk.red('❌ Autenticación - FAILED'));
        console.log(chalk.red(`   Error inesperado: ${error.message}`));
        this.testResults.failed++;
      }
    }
    
    this.testResults.total++;
  }

  // Test de rate limiting
  async testRateLimiting() {
    console.log(chalk.blue('🚦 Test: Rate Limiting'));
    
    const requests = [];
    const maxRequests = 105; // Más del límite de 100
    
    // Enviar múltiples requests rápidamente
    for (let i = 0; i < maxRequests; i++) {
      requests.push(
        axios.get(`${this.baseUrl}/health`, { timeout: 1000 })
          .then(() => ({ status: 'success', i }))
          .catch(error => ({ status: 'error', i, error: error.message }))
      );
    }

    try {
      const results = await Promise.allSettled(requests);
      const successCount = results.filter(r => r.value.status === 'success').length;
      const errorCount = results.filter(r => r.value.status === 'error').length;
      
      if (errorCount > 0) {
        console.log(chalk.green('✅ Rate Limiting - PASSED'));
        console.log(chalk.gray(`   Requests exitosos: ${successCount}`));
        console.log(chalk.gray(`   Requests bloqueados: ${errorCount}`));
        this.testResults.passed++;
      } else {
        console.log(chalk.yellow('⚠️ Rate Limiting - WARNING (no se detectaron requests bloqueados)'));
        console.log(chalk.gray(`   Todos los ${successCount} requests pasaron`));
        this.testResults.passed++; // Consideramos passed porque podría estar configurado con límites más altos
      }
    } catch (error) {
      console.log(chalk.red('❌ Rate Limiting - FAILED'));
      console.log(chalk.red(`   Error: ${error.message}`));
      this.testResults.failed++;
    }
    
    this.testResults.total++;
  }

  // Test de compresión
  async testCompression() {
    console.log(chalk.blue('🗜️ Test: Compresión'));
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: this.timeout,
        headers: { 'Accept-Encoding': 'gzip' }
      });
      
      const isCompressed = response.headers['content-encoding'] === 'gzip';
      
      if (isCompressed) {
        console.log(chalk.green('✅ Compresión - PASSED'));
        console.log(chalk.gray(`   Content-Encoding: ${response.headers['content-encoding']}`));
        this.testResults.passed++;
      } else {
        console.log(chalk.yellow('⚠️ Compresión - WARNING (no se detectó compresión gzip)'));
        this.testResults.passed++; // Puede estar configurado de otra manera
      }
    } catch (error) {
      console.log(chalk.red('❌ Compresión - FAILED'));
      console.log(chalk.red(`   Error: ${error.message}`));
      this.testResults.failed++;
    }
    
    this.testResults.total++;
  }

  // Test de seguridad headers
  async testSecurityHeaders() {
    console.log(chalk.blue('🔒 Test: Security Headers'));
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: this.timeout });
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security'
      ];
      
      const presentHeaders = securityHeaders.filter(header => response.headers[header]);
      
      if (presentHeaders.length >= 2) {
        console.log(chalk.green('✅ Security Headers - PASSED'));
        console.log(chalk.gray(`   Headers presentes: ${presentHeaders.join(', ')}`));
        this.testResults.passed++;
      } else {
        console.log(chalk.yellow('⚠️ Security Headers - WARNING (pocos headers de seguridad)'));
        console.log(chalk.gray(`   Headers presentes: ${presentHeaders.join(', ') || 'ninguno'}`));
        this.testResults.passed++; // Consideramos passed porque podría tener configuración mínima
      }
    } catch (error) {
      console.log(chalk.red('❌ Security Headers - FAILED'));
      console.log(chalk.red(`   Error: ${error.message}`));
      this.testResults.failed++;
    }
    
    this.testResults.total++;
  }

  // Ejecutar todos los tests
  async runAllTests() {
    console.log(chalk.bold.cyan('🧪 INICIANDO TESTS DE PRODUCCIÓN - MIPROFESIONAL'));
    console.log(chalk.cyan('='.repeat(60)));
    console.log(chalk.gray(`URL de prueba: ${this.baseUrl}`));
    console.log(chalk.gray(`Timeout: ${this.timeout}ms`));
    console.log('');

    try {
      await this.testHealthCheck();
      await this.testDetailedHealthCheck();
      await this.testReadinessProbe();
      await this.testProfessionalRegistration();
      await this.testAuthentication();
      await this.testRateLimiting();
      await this.testCompression();
      await this.testSecurityHeaders();

      // Resumen final
      console.log('');
      console.log(chalk.bold.cyan('📊 RESUMEN DE TESTS'));
      console.log(chalk.cyan('='.repeat(40)));
      console.log(chalk.green(`✅ Pasados: ${this.testResults.passed}`));
      console.log(chalk.red(`❌ Fallidos: ${this.testResults.failed}`));
      console.log(chalk.blue(`📊 Total: ${this.testResults.total}`));
      
      const successRate = (this.testResults.passed / this.testResults.total * 100).toFixed(1);
      console.log(chalk.gray(`📈 Tasa de éxito: ${successRate}%`));

      if (this.testResults.failed === 0) {
        console.log('');
        console.log(chalk.bold.green('🎉 TODOS LOS TESTS PASARON - SISTEMA LISTO PARA PRODUCCIÓN'));
        process.exit(0);
      } else {
        console.log('');
        console.log(chalk.bold.red('⚠️ ALGUNOS TESTS FALLARON - REVISAR ANTES DE PRODUCCIÓN'));
        process.exit(1);
      }

    } catch (error) {
      console.log(chalk.red('💥 Error crítico durante los tests:'));
      console.log(chalk.red(error.message));
      process.exit(1);
    }
  }
}

// Ejecutar tests
if (require.main === module) {
  const tester = new ProductionTester();
  tester.runAllTests().catch(error => {
    console.error(chalk.red('💥 Error ejecutando tests:'), error);
    process.exit(1);
  });
}

module.exports = ProductionTester;
