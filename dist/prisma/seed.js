"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const bcrypt = require("bcrypt");
const pool = new pg_1.Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const BCRYPT_ROUNDS = 12;
    const adminOrg = await prisma.organisation.upsert({
        where: { id: 'system-org-id' },
        update: {},
        create: {
            id: 'system-org-id',
            name: 'PropFlow System',
        },
    });
    await prisma.user.upsert({
        where: { email: 'admin@propflow.dev' },
        update: {},
        create: {
            orgId: adminOrg.id,
            role: client_1.Role.SUPER_ADMIN,
            name: 'PropFlow Admin',
            email: 'admin@propflow.dev',
            password: await bcrypt.hash('Admin123!', BCRYPT_ROUNDS),
            emailVerified: true,
        },
    });
    const demoOrg = await prisma.organisation.upsert({
        where: { id: 'demo-org-id' },
        update: {},
        create: {
            id: 'demo-org-id',
            name: 'Demo Properties GmbH',
        },
    });
    await prisma.user.upsert({
        where: { email: 'landlord@demo.dev' },
        update: {},
        create: {
            orgId: demoOrg.id,
            role: client_1.Role.LANDLORD,
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
//# sourceMappingURL=seed.js.map