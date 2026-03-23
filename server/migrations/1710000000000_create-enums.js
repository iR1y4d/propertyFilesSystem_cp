exports.up = (pgm) => {
  pgm.createType('user_role', ['مدير', 'موظف']);
  pgm.createType('property_status', ['مؤقت', 'مصدق', 'محجوز']);
  pgm.createType('request_type', ['إضافة', 'تعديل', 'حذف']);
  pgm.createType('request_status', ['في الانتظار', 'مقبول', 'مرفوض']);
  pgm.createType('log_action', ['تسجيل_دخول', 'تسجيل_خروج', 'إضافة', 'حذف', 'تعديل', 'بحث', 'طلب', 'موافقة', 'رفض']);
};

exports.down = (pgm) => {
  pgm.dropType('user_role');
  pgm.dropType('property_status');
  pgm.dropType('request_type');
  pgm.dropType('request_status');
  pgm.dropType('log_action');
};
