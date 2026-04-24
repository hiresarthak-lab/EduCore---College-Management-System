import fetch, { FormData, Blob } from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@edu.com', password: 'admin123' })
  });
  const { token } = await loginRes.json();

  const formData = new FormData();
  formData.append('name', 'Final Test Subj');
  // Randomizing code so it doesn't collide
  formData.append('code', 'FT' + Math.random());
  formData.append('courseId', '69e8613003bd3c12b69a17cd');
  formData.append('semester', '1');
  
  const blob = new Blob(['helloworld'], { type: 'application/pdf' });
  formData.append('file', blob, 'test.pdf');

  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const res = await fetch('http://localhost:3000/api/academic/subjects', {
    method: 'POST',
    headers,
    body: formData
  });

  console.log(res.status);
  console.log(await res.text());
}
test();
