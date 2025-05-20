import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Menjalankan seed...');

  // Buat user admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { phoneNumber: 'admin' },
    update: {},
    create: {
      name: 'Administrator',
      phoneNumber: 'admin',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  
  console.log('Admin user created:', admin.id);
  
  // Buat paket Starter dan Business
  const starterPackage = await prisma.packageType.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      name: 'Starter',
      price: 199000,
      messageQuota: 500,
      validityDays: 30,
      description: 'Paket Starter untuk kebutuhan bisnis kecil'
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Starter',
      price: 199000,
      messageQuota: 500,
      validityDays: 30,
      description: 'Paket Starter untuk kebutuhan bisnis kecil'
    }
  });
  
  const businessPackage = await prisma.packageType.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      name: 'Business',
      price: 499000,
      messageQuota: 2000,
      validityDays: 30,
      description: 'Paket Business untuk kebutuhan bisnis menengah'
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Business',
      price: 499000,
      messageQuota: 2000,
      validityDays: 30,
      description: 'Paket Business untuk kebutuhan bisnis menengah'
    }
  });
  
  console.log('Package created:', starterPackage.name, businessPackage.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });