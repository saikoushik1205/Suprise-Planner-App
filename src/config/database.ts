import dns from 'node:dns';

import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  // Windows resolvers often fail Atlas SRV lookups; public DNS can resolve them.
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 20000,
  });
  console.log('MongoDB connected successfully');
}

export function getDatabaseStatus(): 'connected' | 'disconnected' {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
