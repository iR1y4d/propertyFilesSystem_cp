const { z } = require('zod');

/**
 * Validates login request body
 */
const loginSchema = z.object({
  body: z.object({
    username: z.string({
      required_error: 'اسم المستخدم مطلوب'
    }).min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
    password: z.string({
      required_error: 'كلمة المرور مطلوبة'
    }).min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
  })
});

module.exports = {
  loginSchema
};
