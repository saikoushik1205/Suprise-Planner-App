import dotenv from 'dotenv';

import { connectDatabase } from '../src/config/database.js';
import { seedTestAccounts } from '../src/services/seedTestAccounts.js';

dotenv.config();

await connectDatabase();
await seedTestAccounts();
process.exit(0);
