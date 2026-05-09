const base = 'http://localhost:3005/api';
const fetch = global.fetch;
function log(title, value) {
  console.log('=== ' + title + ' ===');
  console.log(JSON.stringify(value, null, 2));
}
(async () => {
  try {
    const stamp = Date.now();
    const email = `test.user.${stamp}@example.com`;
    const password = 'DemoPass123!';
    const userData = { name: 'Test User', email, password, phone: `+54911123${String(stamp).slice(-4)}`, role: 'client', location: 'Buenos Aires, Argentina', acceptTerms: true };

    const registerRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const registerData = await registerRes.json();
    log('register', { status: registerRes.status, body: registerData });
    if (!registerRes.ok) throw new Error('Register failed');

    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    log('login', { status: loginRes.status, body: loginData });
    if (!loginRes.ok) throw new Error('Login failed');
    const token = loginData.accessToken;

    const professionalPayload = {
      businessName: 'Test Pro Service',
      profession: 'Plomero',
      category: 'plomeria',
      description: 'Profesional de prueba para tests e2e',
      phone: `+54911666${String(stamp).slice(-4)}`,
      email: `pro.${stamp}@example.com`,
      imageUrl: '',
      isActive: true,
      isFeatured: false,
      location: {
        address: 'CABA',
        city: 'Buenos Aires',
        coordinates: { type: 'Point', coordinates: [-58.3816, -34.6037] },
        serviceRadiusKm: 50
      },
      verification: { status: 'verified', isVerified: true },
      stats: { rating: 4.8, reviewCount: 12, completedBookings: 5 },
      pricing: { hourlyRate: 250 }
    };

    const createProRes = await fetch(`${base}/professionals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(professionalPayload)
    });
    const createProData = await createProRes.json();
    log('create professional', { status: createProRes.status, body: createProData });
    if (!createProRes.ok) throw new Error('Create professional failed');
    const professionalId = createProData.professional._id;

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const date = tomorrow.toISOString().slice(0, 10);
    const time = '15:00';

    const createBookingRes = await fetch(`${base}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ professionalId, date, time, service: 'Reparación de cañería' })
    });
    const createBookingData = await createBookingRes.json();
    log('create booking', { status: createBookingRes.status, body: createBookingData });
    if (!createBookingRes.ok) throw new Error('Create booking failed');

    console.log('E2E API booking completed successfully');
  } catch (error) {
    console.error('E2E API booking failed:', error);
    process.exit(1);
  }
})();
