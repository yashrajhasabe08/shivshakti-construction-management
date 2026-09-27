const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database from server/database.json...');
  const dbPath = path.join(__dirname, '..', 'server', 'database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  // 1. Seed Partners
  for (const p of db.partners || []) {
    await prisma.partner.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        location: p.location,
        role: p.role,
        mobile: p.mobile,
        capitalInvested: BigInt(p.capitalInvested || 0)
      },
      create: {
        id: p.id,
        name: p.name,
        location: p.location,
        role: p.role,
        mobile: p.mobile,
        capitalInvested: BigInt(p.capitalInvested || 0)
      }
    });
  }
  console.log('✓ Partners seeded');

  // 2. Seed Clients
  for (const c of db.clients || []) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        contactPerson: c.contactPerson,
        mobile: c.mobile,
        email: c.email,
        projectAssigned: c.projectAssigned,
        totalContractValue: BigInt(c.totalContractValue || 0),
        totalReceived: BigInt(c.totalReceived || 0),
        pendingBalance: BigInt(c.pendingBalance || 0)
      },
      create: {
        id: c.id,
        name: c.name,
        contactPerson: c.contactPerson,
        mobile: c.mobile,
        email: c.email,
        projectAssigned: c.projectAssigned,
        totalContractValue: BigInt(c.totalContractValue || 0),
        totalReceived: BigInt(c.totalReceived || 0),
        pendingBalance: BigInt(c.pendingBalance || 0)
      }
    });
  }
  console.log('✓ Clients seeded');

  // 3. Seed Users
  for (const u of db.users || []) {
    let passwordHash = u.passwordHash;
    if (!passwordHash) {
      passwordHash = await bcrypt.hash(u.password || 'admin123', 10);
    }

    await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        passwordHash,
        name: u.name,
        role: u.role,
        partnerId: u.partnerId || null,
        clientId: u.clientId || null,
        location: u.location,
        title: u.title
      },
      create: {
        id: u.id,
        email: u.email.toLowerCase(),
        passwordHash,
        name: u.name,
        role: u.role,
        partnerId: u.partnerId || null,
        clientId: u.clientId || null,
        location: u.location,
        title: u.title
      }
    });
  }
  console.log('✓ Users seeded with bcrypt hashed passwords');

  // 4. Seed Projects
  for (const p of db.projects || []) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        district: p.district || null,
        division: p.division || null,
        location: p.location,
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        clientName: p.clientName,
        budget: BigInt(p.budget || 0),
        actualCost: BigInt(p.actualCost || 0),
        status: p.status,
        completionPercent: p.completionPercent || 0
      },
      create: {
        id: p.id,
        name: p.name,
        district: p.district || null,
        division: p.division || null,
        location: p.location,
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        clientName: p.clientName,
        budget: BigInt(p.budget || 0),
        actualCost: BigInt(p.actualCost || 0),
        status: p.status,
        completionPercent: p.completionPercent || 0
      }
    });
  }
  console.log('✓ Projects seeded');

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
