// Load Test Scenarios - Enterprise Stress Testing Scenarios
// Escenarios de carga realistas tipo Rappi/Uber scale

console.log("📋 Load Test Scenarios - Enterprise Stress Testing Scenarios");

const crypto = require('crypto');

class LoadTestScenarios {
  constructor() {
    this.name = 'load-test-scenarios';
    
    // Test data generators
    this.testData = {
      users: this.generateTestUsers(1000),
      professionals: this.generateTestProfessionals(100),
      services: this.generateTestServices(),
      locations: this.generateTestLocations()
    };
  }

  /**
   * Generate test users
   */
  generateTestUsers(count) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        email: `testuser${i}@loadtest.com`,
        password: 'Test123456!',
        name: `Test User ${i}`,
        phone: `+54911${String(i).padStart(8, '0')}`
      });
    }
    return users;
  }

  /**
   * Generate test professionals
   */
  generateTestProfessionals(count) {
    const professionals = [];
    const categories = ['plumbing', 'electricity', 'construction', 'beauty', 'cleaning'];
    
    for (let i = 0; i < count; i++) {
      professionals.push({
        email: `testpro${i}@loadtest.com`,
        password: 'Test123456!',
        name: `Test Professional ${i}`,
        phone: `+54911${String(i + 1000).padStart(8, '0')}`,
        category: categories[i % categories.length],
        hourlyRate: 50 + (i % 100),
        location: this.testData.locations[i % this.testData.locations.length]
      });
    }
    return professionals;
  }

  /**
   * Generate test services
   */
  generateTestServices() {
    return [
      { name: 'Plumbing Repair', category: 'plumbing', duration: 120 },
      { name: 'Electrical Installation', category: 'electricity', duration: 180 },
      { name: 'Home Construction', category: 'construction', duration: 480 },
      { name: 'Beauty Treatment', category: 'beauty', duration: 90 },
      { name: 'House Cleaning', category: 'cleaning', duration: 150 }
    ];
  }

  /**
   * Generate test locations (Buenos Aires area)
   */
  generateTestLocations() {
    return [
      { lat: -34.6037, lng: -58.3816 }, // Buenos Aires Centro
      { lat: -34.5908, lng: -58.3963 }, // Palermo
      { lat: -34.6178, lng: -58.3680 }, // Recoleta
      { lat: -34.6037, lng: -58.4183 }, // Caballito
      { lat: -34.5895, lng: -58.3986 }, // Belgrano
      { lat: -34.6269, lng: -58.4358 }, // Flores
      { lat: -34.5744, lng: -58.4386 }, // Villa Urquiza
      { lat: -34.6175, lng: -58.3800 }, // Balvanera
      { lat: -34.5926, lng: -58.4120 }, // Almagro
      { lat: -34.6415, lng: -58.3940 }  // Parque Patricios
    ];
  }

  /**
   * Scenario 1: Auth Load Test
   */
  getAuthLoadScenario() {
    return {
      name: 'AUTH_LOAD_TEST',
      description: '1000 login + 500 register requests',
      duration: 60000, // 1 minute
      concurrency: 50,
      iterations: 1500,
      requests: [
        {
          endpoint: '/api/auth/login',
          method: 'POST',
          weight: 2, // 2/3 login requests
          body: (index) => {
            const user = this.testData.users[index % this.testData.users.length];
            return {
              email: user.email,
              password: user.password
            };
          }
        },
        {
          endpoint: '/api/auth/register',
          method: 'POST',
          weight: 1, // 1/3 register requests
          body: (index) => {
            const user = this.testData.users[index % this.testData.users.length];
            return {
              email: `newuser${index}@loadtest.com`,
              password: 'Test123456!',
              name: `New User ${index}`,
              phone: `+54911${String(index).padStart(8, '0')}`
            };
          }
        }
      ]
    };
  }

  /**
   * Scenario 2: Bookings Load Test
   */
  getBookingsLoadScenario() {
    return {
      name: 'BOOKINGS_LOAD_TEST',
      description: '500 create + 500 get bookings',
      duration: 120000, // 2 minutes
      concurrency: 40,
      iterations: 1000,
      requests: [
        {
          endpoint: '/api/bookings',
          method: 'POST',
          weight: 1,
          body: (index) => {
            const professional = this.testData.professionals[index % this.testData.professionals.length];
            const service = this.testData.services[index % this.testData.services.length];
            const user = this.testData.users[index % this.testData.users.length];
            
            return {
              professional: professional._id || `prof_${index}`,
              service: service.name,
              date: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // Tomorrow
              price: professional.hourlyRate,
              notes: `Load test booking ${index}`,
              user: user._id || `user_${index}`
            };
          }
        },
        {
          endpoint: '/api/bookings',
          method: 'GET',
          weight: 1,
          headers: (index) => ({
            'Authorization': `Bearer mock_token_${index}`
          })
        }
      ]
    };
  }

  /**
   * Scenario 3: Geolocation Load Test
   */
  getGeolocationLoadScenario() {
    return {
      name: 'GEOLOCATION_LOAD_TEST',
      description: '1000 nearby endpoint requests',
      duration: 90000, // 1.5 minutes
      concurrency: 60,
      iterations: 1000,
      requests: [
        {
          endpoint: '/api/professionals/nearby',
          method: 'GET',
          body: (index) => {
            const location = this.testData.locations[index % this.testData.locations.length];
            const radius = 5000 + (index % 10000); // 5-15km radius
            
            return {
              lat: location.lat + (Math.random() - 0.5) * 0.01, // Small variation
              lng: location.lng + (Math.random() - 0.5) * 0.01,
              radius: radius,
              category: ['plumbing', 'electricity', 'construction', 'beauty', 'cleaning'][index % 5]
            };
          }
        }
      ]
    };
  }

  /**
   * Scenario 4: Mixed Traffic (Real World)
   */
  getMixedTrafficScenario() {
    return {
      name: 'MIXED_TRAFFIC_REAL_WORLD',
      description: '40% auth + 40% bookings + 20% geolocation',
      phases: [
        {
          name: 'WARMUP',
          concurrency: 100,
          iterations: 200,
          requests: this.getMixedRequests(200)
        },
        {
          name: 'MODERATE_LOAD',
          concurrency: 300,
          iterations: 600,
          requests: this.getMixedRequests(600)
        },
        {
          name: 'HIGH_LOAD',
          concurrency: 500,
          iterations: 1000,
          requests: this.getMixedRequests(1000)
        },
        {
          name: 'PEAK_LOAD',
          concurrency: 1000,
          iterations: 1500,
          requests: this.getMixedRequests(1500)
        }
      ]
    };
  }

  /**
   * Get mixed requests for real-world scenario
   */
  getMixedRequests(totalRequests) {
    const authRequests = Math.floor(totalRequests * 0.4);
    const bookingRequests = Math.floor(totalRequests * 0.4);
    const geoRequests = totalRequests - authRequests - bookingRequests;
    
    const requests = [];
    
    // Auth requests (40%)
    for (let i = 0; i < authRequests; i++) {
      requests.push({
        endpoint: '/api/auth/login',
        method: 'POST',
        weight: 1,
        body: (index) => {
          const user = this.testData.users[index % this.testData.users.length];
          return {
            email: user.email,
            password: user.password
          };
        }
      });
    }
    
    // Booking requests (40%)
    for (let i = 0; i < bookingRequests; i++) {
      const isCreate = i % 2 === 0; // 50% create, 50% get
      
      if (isCreate) {
        requests.push({
          endpoint: '/api/bookings',
          method: 'POST',
          weight: 1,
          body: (index) => {
            const professional = this.testData.professionals[index % this.testData.professionals.length];
            const service = this.testData.services[index % this.testData.services.length];
            
            return {
              professional: professional._id || `prof_${index}`,
              service: service.name,
              date: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
              price: professional.hourlyRate,
              notes: `Load test booking ${index}`
            };
          }
        });
      } else {
        requests.push({
          endpoint: '/api/bookings',
          method: 'GET',
          weight: 1,
          headers: (index) => ({
            'Authorization': `Bearer mock_token_${index}`
          })
        });
      }
    }
    
    // Geolocation requests (20%)
    for (let i = 0; i < geoRequests; i++) {
      requests.push({
        endpoint: '/api/professionals/nearby',
        method: 'GET',
        weight: 1,
        body: (index) => {
          const location = this.testData.locations[index % this.testData.locations.length];
          
          return {
            lat: location.lat + (Math.random() - 0.5) * 0.01,
            lng: location.lng + (Math.random() - 0.5) * 0.01,
            radius: 5000 + (index % 10000),
            category: ['plumbing', 'electricity', 'construction', 'beauty', 'cleaning'][index % 5]
          };
        }
      });
    }
    
    return requests;
  }

  /**
   * Scenario 5: Stress Test (Maximum Load)
   */
  getStressTestScenario() {
    return {
      name: 'STRESS_TEST_MAXIMUM',
      description: 'Maximum concurrent users test',
      duration: 300000, // 5 minutes
      concurrency: 1000,
      iterations: 5000,
      requests: [
        {
          endpoint: '/api/auth/login',
          method: 'POST',
          weight: 3,
          body: (index) => {
            const user = this.testData.users[index % this.testData.users.length];
            return {
              email: user.email,
              password: user.password
            };
          }
        },
        {
          endpoint: '/api/bookings',
          method: 'POST',
          weight: 2,
          body: (index) => {
            const professional = this.testData.professionals[index % this.testData.professionals.length];
            const service = this.testData.services[index % this.testData.services.length];
            
            return {
              professional: professional._id || `prof_${index}`,
              service: service.name,
              date: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
              price: professional.hourlyRate,
              notes: `Stress test booking ${index}`
            };
          }
        },
        {
          endpoint: '/api/professionals/nearby',
          method: 'GET',
          weight: 1,
          body: (index) => {
            const location = this.testData.locations[index % this.testData.locations.length];
            
            return {
              lat: location.lat + (Math.random() - 0.5) * 0.01,
              lng: location.lng + (Math.random() - 0.5) * 0.01,
              radius: 5000 + (index % 10000),
              category: ['plumbing', 'electricity', 'construction', 'beauty', 'cleaning'][index % 5]
            };
          }
        }
      ]
    };
  }

  /**
   * Scenario 6: Race Condition Test
   */
  getRaceConditionScenario() {
    return {
      name: 'RACE_CONDITION_TEST',
      description: 'Test concurrent booking creation',
      duration: 60000, // 1 minute
      concurrency: 100,
      iterations: 500,
      requests: [
        {
          endpoint: '/api/bookings',
          method: 'POST',
          weight: 1,
          body: (index) => {
            // Use same professional and time to trigger race conditions
            const professional = this.testData.professionals[0]; // Same professional
            const targetDate = new Date(Date.now() + (24 * 60 * 60 * 1000)); // Same time
            
            return {
              professional: professional._id || 'prof_0',
              service: 'Plumbing Repair',
              date: targetDate.toISOString(),
              price: professional.hourlyRate,
              notes: `Race condition test ${index}`
            };
          }
        }
      ]
    };
  }

  /**
   * Get all available scenarios
   */
  getAllScenarios() {
    return {
      auth: this.getAuthLoadScenario(),
      bookings: this.getBookingsLoadScenario(),
      geolocation: this.getGeolocationLoadScenario(),
      mixed: this.getMixedTrafficScenario(),
      stress: this.getStressTestScenario(),
      raceCondition: this.getRaceConditionScenario()
    };
  }

  /**
   * Get scenario by name
   */
  getScenario(name) {
    const scenarios = this.getAllScenarios();
    return scenarios[name] || null;
  }

  /**
   * Validate scenario configuration
   */
  validateScenario(scenario) {
    const errors = [];
    
    if (!scenario.name) {
      errors.push('Scenario name is required');
    }
    
    if (!scenario.requests && !scenario.phases) {
      errors.push('Scenario must have requests or phases');
    }
    
    if (scenario.concurrency && scenario.concurrency > 2000) {
      errors.push('Concurrency too high (max 2000)');
    }
    
    if (scenario.iterations && scenario.iterations > 10000) {
      errors.push('Too many iterations (max 10000)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get test data summary
   */
  getTestDataSummary() {
    return {
      users: this.testData.users.length,
      professionals: this.testData.professionals.length,
      services: this.testData.services.length,
      locations: this.testData.locations.length,
      categories: [...new Set(this.testData.professionals.map(p => p.category))]
    };
  }
}

module.exports = {
  LoadTestScenarios
};
