import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const BCRYPT_ROUNDS = 12;

  // Create Super Admin org (system org)
  const adminOrg = await prisma.organisation.upsert({
    where: { id: 'system-org-id' },
    update: {},
    create: {
      id: 'system-org-id',
      name: 'PropFlow System',
    },
  });

  // Create Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@propflow.dev' },
    update: {},
    create: {
      orgId: adminOrg.id,
      role: Role.SUPER_ADMIN,
      name: 'PropFlow Admin',
      email: 'admin@propflow.dev',
      password: await bcrypt.hash('Admin123!', BCRYPT_ROUNDS),
      emailVerified: true,
    },
  });

  // Create Demo Organisation
  const demoOrg = await prisma.organisation.upsert({
    where: { id: 'demo-org-id' },
    update: {},
    create: {
      id: 'demo-org-id',
      name: 'Demo Properties GmbH',
    },
  });

  // Create Demo Landlord
  await prisma.user.upsert({
    where: { email: 'landlord@demo.dev' },
    update: {},
    create: {
      orgId: demoOrg.id,
      role: Role.LANDLORD,
      name: 'Demo Landlord',
      email: 'landlord@demo.dev',
      password: await bcrypt.hash('Demo123!', BCRYPT_ROUNDS),
      emailVerified: true,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
