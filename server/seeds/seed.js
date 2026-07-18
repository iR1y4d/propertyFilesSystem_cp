require('dotenv').config();
const { query } = require('../config/db');
const { hashPassword } = require('../utils/passwordUtils');
const { ROLES, PROPERTY_STATUS } = require('../config/constants');

/**
 * Seed database with initial data
 */
const seed = async () => {
  try {
    console.log('🌱 Seeding database...');

    // 1. Create Admin User
    const adminRaw = process.env.SEED_ADMIN_PASSWORD || 'Admin@2026';
    const adminPassword = await hashPassword(adminRaw);
    await query(
      'INSERT INTO users (first_name, last_name, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
      ['مدير', 'النظام', 'admin', adminPassword, ROLES.ADMIN]
    );
    console.log(`✅ Admin user created (password: ${process.env.SEED_ADMIN_PASSWORD ? '********' : 'Admin@2026'})`);

    // 2. Create Employee User
    const employeeRaw = process.env.SEED_EMPLOYEE_PASSWORD || 'Employee@2026';
    const employeePassword = await hashPassword(employeeRaw);
    await query(
      'INSERT INTO users (first_name, last_name, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
      ['موظف', 'أول', 'employee1', employeePassword, ROLES.EMPLOYEE]
    );
    console.log(`✅ Employee user created (password: ${process.env.SEED_EMPLOYEE_PASSWORD ? '********' : 'Employee@2026'})`);

    // 3. Create Department Head User
    const deptHeadRaw = process.env.SEED_DEPT_HEAD_PASSWORD || 'Head@2026';
    const deptHeadPassword = await hashPassword(deptHeadRaw);
    await query(
      'INSERT INTO users (first_name, last_name, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
      ['رئيس', 'قسم', 'head1', deptHeadPassword, ROLES.DEPARTMENT_HEAD]
    );
    console.log(`✅ Department Head user created (password: ${process.env.SEED_DEPT_HEAD_PASSWORD ? '********' : 'Head@2026'})`);

    // 3. Create Sample Properties — using 12-digit national numbers to pass validators
    const properties = [
      [1001, 'أحمد صالح', 123456789012, 'عمان - شارع الاستقلال', '120م', PROPERTY_STATUS.CERTIFIED],
      [1002, 'محمد علي', 234567890123, 'اربد - الحي الشرقي', '150م', PROPERTY_STATUS.TEMPORARY],
      [1003, 'خالد حسن', 345678901234, 'الزرقاء - وادي الحجر', '200م', PROPERTY_STATUS.RESERVED],
      [1004, 'ياسين محمود', 456789012345, 'عمان - خلدا', '180م', PROPERTY_STATUS.CERTIFIED],
      [1005, 'سليمان عيسى', 567890123456, 'العقبة - الخامسة', '300م', PROPERTY_STATUS.TEMPORARY],
    ];

    for (const p of properties) {
      await query(
        'INSERT INTO properties (property_file_number, owner_name, national_number, location, area, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (property_file_number) DO NOTHING',
        p
      );
    }
    console.log('✅ Sample properties created');

    console.log('✨ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
