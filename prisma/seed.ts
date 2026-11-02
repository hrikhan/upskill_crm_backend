import { PrismaClient, UserRole, ModulePermissionKey } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  console.log('🌱 Seeding Upskill CRM database...');

  // 1. Super Admin (Root Platform Master)
  const superAdminPassword = await bcrypt.hash('super123', saltRounds);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@upskillcrm.com' },
    update: { passwordHash: superAdminPassword },
    create: {
      email: 'superadmin@upskillcrm.com',
      name: 'Upskill CRM Root',
      role: UserRole.SUPER_ADMIN,
      passwordHash: superAdminPassword,
      phone: '01700000000',
      designation: 'Managing Director & Founder',
      department: 'Executive Board',
    },
  });

  // 2. Admin (General Manager)
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@upskillcrm.com' },
    update: { passwordHash: adminPassword },
    create: {
      email: 'admin@upskillcrm.com',
      name: 'Hridoy Khan',
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      phone: '01711111111',
      designation: 'Operations Director',
      department: 'Operations & Management',
    },
  });

  // 3. Staff - Sales Representative
  const staffPassword = await bcrypt.hash('staff123', saltRounds);
  const salesStaff = await prisma.user.upsert({
    where: { email: 'sales@upskillcrm.com' },
    update: { passwordHash: staffPassword },
    create: {
      email: 'sales@upskillcrm.com',
      name: 'Sarah Jenkins',
      role: UserRole.STAFF,
      passwordHash: staffPassword,
      phone: '01722222222',
      designation: 'Senior Sales Executive',
      department: 'Sales & BD',
    },
  });

  const salesModules = [ModulePermissionKey.LEADS, ModulePermissionKey.CUSTOMERS, ModulePermissionKey.PROPOSALS];
  for (const mod of salesModules) {
    await prisma.staffPermission.upsert({
      where: { userId_module: { userId: salesStaff.id, module: mod } },
      update: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      create: { userId: salesStaff.id, module: mod, canView: true, canCreate: true, canEdit: true, canDelete: false },
    });
  }

  // 4. Staff - Billing Officer
  const billingStaff = await prisma.user.upsert({
    where: { email: 'billing@upskillcrm.com' },
    update: { passwordHash: staffPassword },
    create: {
      email: 'billing@upskillcrm.com',
      name: 'Rashid Ahmed',
      role: UserRole.STAFF,
      passwordHash: staffPassword,
      phone: '01733333333',
      designation: 'Billing & Accounts Officer',
      department: 'Finance & Accounts',
    },
  });

  const billingModules = [ModulePermissionKey.SALES, ModulePermissionKey.SUBSCRIPTIONS, ModulePermissionKey.PAYMENTS, ModulePermissionKey.CUSTOMERS];
  for (const mod of billingModules) {
    await prisma.staffPermission.upsert({
      where: { userId_module: { userId: billingStaff.id, module: mod } },
      update: { canView: true, canCreate: true, canEdit: true, canDelete: false },
      create: { userId: billingStaff.id, module: mod, canView: true, canCreate: true, canEdit: true, canDelete: false },
    });
  }

  // 5. Staff - HR Officer
  const hrStaff = await prisma.user.upsert({
    where: { email: 'hr@upskillcrm.com' },
    update: { passwordHash: staffPassword },
    create: {
      email: 'hr@upskillcrm.com',
      name: 'Farhana Yasmin',
      role: UserRole.STAFF,
      passwordHash: staffPassword,
      phone: '01744444444',
      designation: 'Human Resources Officer',
      department: 'Human Resources',
    },
  });

  await prisma.staffPermission.upsert({
    where: { userId_module: { userId: hrStaff.id, module: ModulePermissionKey.TEAM } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    create: { userId: hrStaff.id, module: ModulePermissionKey.TEAM, canView: true, canCreate: true, canEdit: true, canDelete: false },
  });

  console.log('✅ Upskill CRM Seed Finished: Super Admin, Admin, and Staff personas initialized.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.();
  });
