// Verification System Test - Test completo del sistema de verificación
// Test para validar todas las funcionalidades del sistema de verificación

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generarToken } = require('../config/jwt');
const User = require('../models/User');
const Professional = require('../models/Professional');

class VerificationSystemTest {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://miprofesional-backend.onrender.com'
      : 'http://localhost:5000';
    
    this.testUser = null;
    this.testProfessional = null;
    this.testCompany = null;
    this.adminToken = null;
    
    console.log('🧪 Verification System Test initialized');
  }
  
  /**
   * Inicializar tests
   */
  async initialize() {
    try {
      console.log('🧪 Initializing verification system tests...');
      
      // Conectar a base de datos de test
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/miprofesional-test');
      
      // Crear usuario admin para tests
      const adminPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        name: 'Admin Test',
        email: 'admin@test.com',
        password: adminPassword,
        location: 'Test Location',
        coordinates: [0, 0],
        isVerified: true,
        verificationStatus: 'verified',
        accountType: 'person'
      });
      
      await adminUser.save();
      this.adminToken = generarToken({ id: adminUser._id, email: adminUser.email });
      
      console.log('✅ Test environment initialized');
      
    } catch (error) {
      console.error('❌ Test initialization error:', error);
      throw error;
    }
  }
  
  /**
   * Test 1: Registro con protección anti-fraude
   */
  async testRegistrationWithAntiFraud() {
    console.log('🧪 Test 1: Registration with anti-fraud protection');
    
    try {
      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '+5491112345678',
        password: 'password123',
        location: 'Test Location',
        coordinates: [0, 0],
        accountType: 'person'
      };
      
      // Test registro exitoso
      const response = await request(this.baseUrl)
        .post('/api/user-flow/register')
        .send(userData)
        .expect(201);
      
      const { success, data } = response.body;
      
      if (!success) {
        throw new Error('Registration should succeed');
      }
      
      // Verificar campos de verificación
      if (data.verificationStatus !== 'unverified') {
        throw new Error(`Expected verificationStatus 'unverified', got '${data.verificationStatus}'`);
      }
      
      if (data.isVerified !== false) {
        throw new Error(`Expected isVerified false, got ${data.isVerified}`);
      }
      
      if (data.accountType !== 'person') {
        throw new Error(`Expected accountType 'person', got '${data.accountType}'`);
      }
      
      this.testUser = data;
      
      console.log('✅ Test 1 passed: User registered with correct verification fields');
      
      // Test email duplicado
      const duplicateResponse = await request(this.baseUrl)
        .post('/api/user-flow/register')
        .send(userData)
        .expect(409);
      
      if (duplicateResponse.body.code !== 'EMAIL_EXISTS') {
        throw new Error('Should detect duplicate email');
      }
      
      console.log('✅ Test 1b passed: Duplicate email detected');
      
      // Test teléfono duplicado
      const phoneDuplicateResponse = await request(this.baseUrl)
        .post('/api/user-flow/register')
        .send({
          ...userData,
          email: 'different@example.com'
        })
        .expect(409);
      
      if (phoneDuplicateResponse.body.code !== 'PHONE_EXISTS') {
        throw new Error('Should detect duplicate phone');
      }
      
      console.log('✅ Test 1c passed: Duplicate phone detected');
      
    } catch (error) {
      console.error('❌ Test 1 failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Test 2: Registro de empresa
   */
  async testCompanyRegistration() {
    console.log('🧪 Test 2: Company registration');
    
    try {
      const companyData = {
        commercialName: 'Test Company S.A.',
        businessName: 'Test Services',
        email: 'company@example.com',
        phone: '+5491198765432',
        password: 'password123',
        location: 'Company Location',
        coordinates: [0, 0],
        categoryId: null,
        description: 'Test company description'
      };
      
      const response = await request(this.baseUrl)
        .post('/api/user-flow/register-company')
        .send(companyData)
        .expect(201);
      
      const { success, data } = response.body;
      
      if (!success) {
        throw new Error('Company registration should succeed');
      }
      
      // Verificar campos específicos de empresa
      if (data.accountType !== 'company') {
        throw new Error(`Expected accountType 'company', got '${data.accountType}'`);
      }
      
      if (!data.commercialName) {
        throw new Error('Commercial name should be present');
      }
      
      if (data.companyFeatures?.noSelfieRequired !== true) {
        throw new Error('Company should not require selfie');
      }
      
      this.testCompany = data;
      
      console.log('✅ Test 2 passed: Company registered with correct fields');
      
    } catch (error) {
      console.error('❌ Test 2 failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Test 3: Flujo de verificación
   */
  async testVerificationFlow() {
    console.log('🧪 Test 3: Verification flow');
    
    try {
      if (!this.testUser) {
        throw new Error('Test user not available');
      }
      
      // Test 3a: Verificar email
      const verifyEmailResponse = await request(this.baseUrl)
        .post('/api/user-flow/verify-email')
        .set('Authorization', `Bearer ${this.testUser.verificationToken}`)
        .send({ token: this.testUser.verificationToken })
        .expect(200);
      
      if (verifyEmailResponse.body.data.emailVerified !== true) {
        throw new Error('Email should be verified');
      }
      
      console.log('✅ Test 3a passed: Email verification works');
      
      // Test 3b: Subir foto de perfil
      const photoResponse = await request(this.baseUrl)
        .post('/api/user-flow/upload-photo')
        .set('Authorization', `Bearer ${this.testUser.verificationToken}`)
        .attach('profileImage', Buffer.from('fake image data'), 'test.jpg')
        .expect(200);
      
      if (photoResponse.body.data.verificationStatus !== 'pending') {
        throw new Error('Status should be pending after photo upload');
      }
      
      console.log('✅ Test 3b passed: Photo upload changes status to pending');
      
      // Test 3c: Auto-verificación
      const autoVerifyResponse = await request(this.baseUrl)
        .post('/api/user-flow/auto-verify')
        .set('Authorization', `Bearer ${this.testUser.verificationToken}`)
        .expect(200);
      
      if (autoVerifyResponse.body.data.verificationStatus !== 'verified') {
        throw new Error('User should be auto-verified');
      }
      
      if (autoVerifyResponse.body.data.isVerified !== true) {
        throw new Error('User should be marked as verified');
      }
      
      console.log('✅ Test 3c passed: Auto-verification works');
      
    } catch (error) {
      console.error('❌ Test 3 failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Test 4: Middleware de verificación en endpoints críticos
   */
  async testVerificationMiddleware() {
    console.log('🧪 Test 4: Verification middleware on critical endpoints');
    
    try {
      // Crear usuario no verificado
      const unverifiedUserData = {
        name: 'Unverified User',
        email: 'unverified@example.com',
        phone: '+5491166667777',
        password: 'password123',
        location: 'Test Location',
        coordinates: [0, 0],
        accountType: 'person'
      };
      
      const registerResponse = await request(this.baseUrl)
        .post('/api/user-flow/register')
        .send(unverifiedUserData)
        .expect(201);
      
      const unverifiedUser = registerResponse.body.data;
      const unverifiedToken = unverifiedUser.verificationToken;
      
      // Test 4a: Intentar crear pago sin verificar
      const paymentResponse = await request(this.baseUrl)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({
          bookingId: 'test-booking-id',
          amount: 1000
        })
        .expect(403);
      
      if (paymentResponse.body.code !== 'ACCOUNT_NOT_VERIFIED') {
        throw new Error('Should block unverified user from payments');
      }
      
      console.log('✅ Test 4a passed: Unverified user blocked from payments');
      
      // Test 4b: Intentar crear reserva sin verificar
      const bookingResponse = await request(this.baseUrl)
        .post('/api/mobile/bookings')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({
          professionalId: 'test-professional-id',
          serviceType: 'test-service',
          date: new Date(),
          location: 'Test Location'
        })
        .expect(403);
      
      if (bookingResponse.body.code !== 'ACCOUNT_NOT_VERIFIED') {
        throw new Error('Should block unverified user from bookings');
      }
      
      console.log('✅ Test 4b passed: Unverified user blocked from bookings');
      
    } catch (error) {
      console.error('❌ Test 4 failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Test 5: Respuestas API con campos de verificación
   */
  async testAPIResponsesWithVerificationFields() {
    console.log('🧪 Test 5: API responses with verification fields');
    
    try {
      // Test 5a: Login response
      const loginResponse = await request(this.baseUrl)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        })
        .expect(200);
      
      const user = loginResponse.body.data.user;
      
      if (!user.hasOwnProperty('isVerified')) {
        throw new Error('Login response should include isVerified');
      }
      
      if (!user.hasOwnProperty('verificationStatus')) {
        throw new Error('Login response should include verificationStatus');
      }
      
      if (!user.hasOwnProperty('accountType')) {
        throw new Error('Login response should include accountType');
      }
      
      if (!user.hasOwnProperty('profileImage')) {
        throw new Error('Login response should include profileImage');
      }
      
      console.log('✅ Test 5a passed: Login response includes verification fields');
      
      // Test 5b: Professional search response
      const professionalResponse = await request(this.baseUrl)
        .get('/api/professionals/nearby')
        .query({ lat: 0, lng: 0 })
        .expect(200);
      
      const professionals = professionalResponse.body.data.professionals;
      
      if (professionals.length > 0) {
        const professional = professionals[0];
        
        if (!professional.hasOwnProperty('verification.isVerified')) {
          throw new Error('Professional response should include verification.isVerified');
        }
        
        if (!professional.hasOwnProperty('verification.verificationStatus')) {
          throw new Error('Professional response should include verification.verificationStatus');
        }
        
        if (!professional.hasOwnProperty('accountType')) {
          throw new Error('Professional response should include accountType');
        }
        
        if (!professional.hasOwnProperty('profileImage')) {
          throw new Error('Professional response should include profileImage');
        }
      }
      
      console.log('✅ Test 5b passed: Professional search response includes verification fields');
      
    } catch (error) {
      console.error('❌ Test 5 failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Test 6: Upload de imágenes con validación
   */
  async testImageUploadValidation() {
    console.log('🧪 Test 6: Image upload validation');
    
    try {
      if (!this.testUser) {
        throw new Error('Test user not available');
      }
      
      // Test 6a: Upload de imagen válida
      const validImageResponse = await request(this.baseUrl)
        .post('/api/profile-image/upload')
        .set('Authorization', `Bearer ${this.testUser.verificationToken}`)
        .attach('profileImage', Buffer.from('fake image data'), 'valid.jpg')
        .expect(200);
      
      if (!validImageResponse.body.data.profileImage) {
        throw new Error('Should return profile image URL');
      }
      
      console.log('✅ Test 6a passed: Valid image upload works');
      
      // Test 6b: Upload de formato inválido
      const invalidFormatResponse = await request(this.baseUrl)
        .post('/api/profile-image/upload')
        .set('Authorization', `Bearer ${this.testUser.verificationToken}`)
        .attach('profileImage', Buffer.from('fake text data'), 'invalid.txt')
        .expect(400);
      
      if (invalidFormatResponse.body.code !== 'INVALID_FORMAT') {
        throw new Error('Should reject invalid format');
      }
      
      console.log('✅ Test 6b passed: Invalid format rejected');
      
      // Test 6c: Upload de archivo vacío
      const emptyFileResponse = await request(this.baseUrl)
        .post('/api/profile-image/upload')
        .set('Authorization', `Bearer ${this.testUser.verificationToken}`)
        .attach('profileImage', Buffer.from(''), 'empty.jpg')
        .expect(400);
      
      if (emptyFileResponse.body.code !== 'EMPTY_FILE') {
        throw new Error('Should reject empty file');
      }
      
      console.log('✅ Test 6c passed: Empty file rejected');
      
    } catch (error) {
      console.error('❌ Test 6 failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Test 7: Rate limiting
   */
  async testRateLimiting() {
    console.log('🧪 Test 7: Rate limiting');
    
    try {
      const userData = {
        name: 'Rate Limit Test',
        email: 'ratelimit@example.com',
        phone: '+5491155556666',
        password: 'password123',
        location: 'Test Location',
        coordinates: [0, 0],
        accountType: 'person'
      };
      
      // Hacer múltiples intentos de registro
      let rateLimitHit = false;
      
      for (let i = 0; i < 5; i++) {
        try {
          await request(this.baseUrl)
            .post('/api/user-flow/register')
            .send({
              ...userData,
              email: `ratelimit${i}@example.com`
            });
        } catch (error) {
          if (error.status === 429) {
            rateLimitHit = true;
            break;
          }
        }
      }
      
      if (!rateLimitHit) {
        throw new Error('Rate limiting should trigger after multiple attempts');
      }
      
      console.log('✅ Test 7 passed: Rate limiting works');
      
    } catch (error) {
      console.error('❌ Test 7 failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Ejecutar todos los tests
   */
  async runAllTests() {
    console.log('🧪 Starting Verification System Tests...');
    
    try {
      await this.initialize();
      
      await this.testRegistrationWithAntiFraud();
      await this.testCompanyRegistration();
      await this.testVerificationFlow();
      await this.testVerificationMiddleware();
      await this.testAPIResponsesWithVerificationFields();
      await this.testImageUploadValidation();
      await this.testRateLimiting();
      
      console.log('🎉 ALL TESTS PASSED! Verification system is working correctly.');
      
      return {
        success: true,
        message: 'All verification system tests passed',
        tests: [
          'Registration with anti-fraud',
          'Company registration',
          'Verification flow',
          'Verification middleware',
          'API responses with verification fields',
          'Image upload validation',
          'Rate limiting'
        ]
      };
      
    } catch (error) {
      console.error('❌ TESTS FAILED:', error.message);
      
      return {
        success: false,
        message: error.message,
        error: error
      };
    } finally {
      // Limpiar test data
      await this.cleanup();
    }
  }
  
  /**
   * Limpiar datos de test
   */
  async cleanup() {
    try {
      console.log('🧹 Cleaning up test data...');
      
      await User.deleteMany({ email: { $regex: /test|example\.com/ } });
      await Professional.deleteMany({ 'contact.email': { $regex: /test|example\.com/ } });
      
      await mongoose.connection.close();
      
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  }
}

module.exports = VerificationSystemTest;
