import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI.replace(/<|>/g, ''));
  const { Subject } = await import('./server/models/Subject.ts');
  try {
    await Subject.collection.dropIndex('code_1');
    console.log('Index dropped');
  } catch(e) {
    console.log('Error dropping index', e);
  }
  process.exit();
}
run();
