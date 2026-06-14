const testLogin = async () => {
  try {
    console.log('Testing login API...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mr.maxim.8806@mail.ru',
        password: 'Kuznetsova051979'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful!');
      console.log('Response:', data);
    } else {
      console.log('Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
    
  } catch (error) {
    console.log('Request failed!');
    console.log('Error:', error.message);
  }
};

testLogin();