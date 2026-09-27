import bcrypt from 'bcryptjs';

import { TEST_CREW, TEST_CUSTOMER } from '../config/testAccounts.js';
import { Surprise } from '../models/Surprise.js';
import { User } from '../models/User.js';

export async function findDefaultCrewId() {
  const rahul = await User.findOne({
    email: TEST_CREW.email,
    role: 'crew',
    crewStatus: 'approved',
  });
  if (rahul) {
    return rahul._id;
  }

  const fallback = await User.findOne({ role: 'crew', crewStatus: 'approved' }).sort({ createdAt: 1 });
  return fallback?._id;
}

export async function seedTestAccounts() {
  const passwordHash = await bcrypt.hash(TEST_CUSTOMER.password, 10);
  const crewPasswordHash = await bcrypt.hash(TEST_CREW.password, 10);

  await User.findOneAndUpdate(
    { email: TEST_CUSTOMER.email },
    {
      $set: {
        name: TEST_CUSTOMER.name,
        email: TEST_CUSTOMER.email,
        passwordHash,
        role: 'customer',
      },
      $unset: { crewStatus: 1 },
    },
    { upsert: true },
  );

  const crew = await User.findOneAndUpdate(
    { email: TEST_CREW.email },
    {
      $set: {
        name: TEST_CREW.name,
        email: TEST_CREW.email,
        passwordHash: crewPasswordHash,
        role: 'crew',
        crewStatus: 'approved',
        phone: TEST_CREW.phone,
        city: TEST_CREW.city,
        crewCategory: TEST_CREW.crewCategory,
        crewExperience: TEST_CREW.crewExperience,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if (crew) {
    await Surprise.updateMany(
      { $or: [{ assignedCrewId: { $exists: false } }, { assignedCrewId: null }] },
      { assignedCrewId: crew._id },
    );
  }

  console.log(`Test accounts ready: ${TEST_CUSTOMER.email} and ${TEST_CREW.email}`);
}
