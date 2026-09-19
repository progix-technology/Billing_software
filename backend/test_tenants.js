async function check() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: 'superadmin@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful');

    const tenantsRes = await fetch('http://localhost:5000/api/tenants', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tenantsData = await tenantsRes.json();
    console.log('Tenants loaded successfully:', tenantsData);
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
