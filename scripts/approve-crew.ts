import dotenv from 'dotenv';

import { connectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx scripts/approve-crew.ts <email>');
  process.exit(1);
}

await connectDatabase();
const user = await User.findOneAndUpdate(
  { email: email.trim().toLowerCase(), role: 'crew' },
  { crewStatus: 'approved' },
  { returnDocument: 'after' },
);

if (!user) {
  console.error('No crew user found for that email.');
  process.exit(1);
}

console.log(`Updated ${user.email} → ${user.crewStatus}`);
process.exit(0);
