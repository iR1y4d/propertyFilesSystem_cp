const { z } = require('zod');

/**
 * Validates request submission
 */
const submitRequestSchema = z.object({
  body: z.object({
    propertyFileNumber: z.number({
      required_error: 'رقم ملف العقار مطلوب'
    }).int().positive(),
    requestType: z.enum(['إضافة', 'تعديل', 'حذف', 'حذف_صور'], {
      errorMap: () => ({ message: 'نوع الطلب غير صحيح' })
    }),
    requestDescription: z.string().max(255).optional().or(z.literal('')),
    newData: z.object({
      ownerName: z.string().min(2, 'اسم المالك يجب أن يكون حرفين على الأقل').max(255).optional(),
      nationalNumber: z.number().int().refine(n => String(n).length === 12, {
        message: 'الرقم الوطني يجب أن يكون 12 رقم'
      }).optional(),
      location: z.string().min(2, 'الموقع يجب أن يكون حرفين على الأقل').max(255).optional(),
      area: z.string().min(1).max(100).optional(),
      status: z.enum(['مؤقت', 'مصدق', 'محجوز'], {
        errorMap: () => ({ message: 'حالة العقار غير صحيحة' })
      }).optional(),
      imagesToDelete: z.array(z.string()).max(20).optional(),
    }).optional()
  })
});

module.exports = {
  submitRequestSchema
};
