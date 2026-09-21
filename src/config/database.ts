import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

async function connectDatabase() {
  const atlasUrl = env.ATLAS_URL;

  try {
    // Attempting to bypass local DNS SRV blocking
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('DNS override failed, using system defaults.');
  }

  await mongoose.connect(atlasUrl, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log('MongoDB connected successfully');
}

export default connectDatabase;