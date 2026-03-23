const { z } = require('zod');

/**
 * Validates request submission
 */
const submitRequestSchema = z.object({
  body: z.object({
    propertyFileNumber: z.number({
      required_error: 'رقم ملف العقار مطلوب'
    }).int().positive(),
    requestType: z.enum(['إضافة', 'تعديل', 'حذف'], {
      errorMap: () => ({ message: 'نوع الطلب غير صحيح' })
    }),
    requestDescription: z.string().max(255).optional().or(z.literal('')),
    newData: z.record(z.any()).optional()
  })
});

module.exports = {
  submitRequestSchema
};
