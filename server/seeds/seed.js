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
    const adminPassword = await hashPassword('Admin@2026');
    await query(
      'INSERT INTO users (first_name, last_name, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
      ['مدير', 'النظام', 'admin', adminPassword, ROLES.ADMIN]
    );
    console.log('✅ Admin user created');

    // 2. Create Employee User
    const employeePassword = await hashPassword('Employee@2026');
    await query(
      'INSERT INTO users (first_name, last_name, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
      ['موظف', 'أول', 'employee1', employeePassword, ROLES.EMPLOYEE]
    );
    console.log('✅ Employee user created');

    // 3. Create Sample Properties
    const properties = [
      [1001, 'أحمد صالح', 1234567890, 'عمان - شارع الاستقلال', '120م', PROPERTY_STATUS.CERTIFIED],
      [1002, 'محمد علي', 2345678901, 'اربد - الحي الشرقي', '150م', PROPERTY_STATUS.TEMPORARY],
      [1003, 'خالد حسن', 3456789012, 'الزرقاء - وادي الحجر', '200م', PROPERTY_STATUS.RESERVED],
      [1004, 'ياسين محمود', 4567890123, 'عمان - خلدا', '180م', PROPERTY_STATUS.CERTIFIED],
      [1005, 'سليمان عيسى', 5678901234, 'العقبة - الخامسة', '300م', PROPERTY_STATUS.TEMPORARY],
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
