const { z } = require('zod');
const { ROLES } = require('../config/constants');

/**
 * Validates user creation
 */
const createUserSchema = z.object({
  body: z.object({
    firstName: z.string({
      required_error: 'الاسم الأول مطلوب'
    }).min(2, 'الاسم الأول يجب أن يكون حرفين على الأقل').max(100),
    lastName: z.string({
      required_error: 'الاسم الأخير مطلوب'
    }).min(2, 'الاسم الأخير يجب أن يكون حرفين على الأقل').max(100),
    username: z.string({
      required_error: 'اسم المستخدم مطلوب'
    }).min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').max(100),
    password: z.string({
      required_error: 'كلمة المرور مطلوبة'
    }).min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل')
      .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل')
      .regex(/[^A-Za-z0-9]/, 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل'),
    role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD], {
      errorMap: () => ({ message: 'الدور غير صحيح' })
    })
  })
});

/**
 * Validates user update
 */
const updateUserSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'معرف المستخدم مطلوب'
    })
  }),
  body: z.object({
    firstName: z.string().min(2).max(100).optional(),
    lastName: z.string().min(2).max(100).optional(),
    role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD]).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'يجب تقديم حقل واحد على الأقل للتحديث'
  })
});

/**
 * Validates password reset
 */
const resetPasswordSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'معرف المستخدم مطلوب'
    })
  }),
  body: z.object({
    password: z.string({
      required_error: 'كلمة المرور الجديدة مطلوبة'
    }).min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/)
  })
});

/**
 * Validates self-service password change
 */
const changePasswordSchema = z.object({
  body: z.object({
    username: z.string({
      required_error: 'اسم المستخدم مطلوب'
    }),
    currentPassword: z.string({
      required_error: 'كلمة المرور الحالية مطلوبة'
    }),
    newPassword: z.string({
      required_error: 'كلمة المرور الجديدة مطلوبة'
    }).min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل')
      .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل')
      .regex(/[^A-Za-z0-9]/, 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل'),
    confirmPassword: z.string({
      required_error: 'تأكيد كلمة المرور الجديدة مطلوب'
    })
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'كلمتا المرور الجديدتان غير متطابقتين',
    path: ['confirmPassword']
  })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  changePasswordSchema
};
