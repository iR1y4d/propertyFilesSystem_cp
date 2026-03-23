const { z } = require('zod');

/**
 * Validates property creation
 */
const createPropertySchema = z.object({
  body: z.object({
    propertyFileNumber: z.number({
      required_error: 'رقم ملف العقار مطلوب'
    }).int().positive(),
    ownerName: z.string({
      required_error: 'اسم المالك مطلوب'
    }).min(2, 'اسم المالك يجب أن يكون حرفين على الأقل').max(255),
    nationalNumber: z.number({
      required_error: 'الرقم الوطني مطلوب'
    }).int().refine(n => String(n).length === 10, {
      message: 'الرقم الوطني يجب أن يكون 10 أرقام'
    }),
    location: z.string({
      required_error: 'الموقع مطلوب'
    }).min(2, 'الموقع يجب أن يكون حرفين على الأقل').max(255),
    area: z.string({
      required_error: 'المساحة مطلوبة'
    }).min(1, 'المساحة مطلوبة').max(100),
    status: z.enum(['مؤقت', 'مصدق', 'محجوز'], {
      errorMap: () => ({ message: 'حالة العقار غير صحيحة' })
    })
  })
});

/**
 * Validates property update
 */
const updatePropertySchema = z.object({
  params: z.object({
    fileNumber: z.string({
      required_error: 'رقم الملف مطلوب'
    })
  }),
  body: z.object({
    ownerName: z.string().min(2, 'اسم المالك يجب أن يكون حرفين على الأقل').max(255).optional(),
    nationalNumber: z.number().int().refine(n => String(n).length === 10, {
      message: 'الرقم الوطني يجب أن يكون 10 أرقام'
    }).optional(),
    location: z.string().min(2, 'الموقع يجب أن يكون حرفين على الأقل').max(255).optional(),
    area: z.string().min(1).max(100).optional(),
    status: z.enum(['مؤقت', 'مصدق', 'محجوز'], {
      errorMap: () => ({ message: 'حالة العقار غير صحيحة' })
    }).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'يجب تقديم حقل واحد على الأقل للتحديث'
  })
});

module.exports = {
  createPropertySchema,
  updatePropertySchema
};
