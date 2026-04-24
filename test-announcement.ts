import dotenv from 'dotenv';
dotenv.config();
import { app } from './server.ts';
import request from 'supertest';
import mongoose from 'mongoose';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI.replace(/<|>/g, ''));
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jamdhade@edu.com', password: 'password123' });
    
  const token = loginRes.body.token;
  if (!token) {
    console.log("No token:", loginRes.body);
    process.exit(1);
  }
  
  const createRes = await request(app)
    .post('/api/academic/announcements')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Announcement',
      content: 'This is a test',
      targetRole: 'all'
    });
    
  console.log('Status', createRes.status);
  console.log('Body', createRes.body);
  console.log('Text', createRes.text);
  process.exit();
}
test();
