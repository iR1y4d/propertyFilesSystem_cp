const { z } = require('zod');

const propertySearchSchema = z.object({
  query: z.object({
    search: z.string().max(200).optional(),
    status: z.enum(['مؤقت', 'مصدق', 'محجوز'], {
      errorMap: () => ({ message: 'حالة العقار غير صحيحة' })
    }).optional(),
    location: z.string().max(200).optional(),
    propertyFileNumber: z.string().max(20).optional(),
    ownerName: z.string().max(200).optional(),
    nationalNumber: z.string().max(20).optional(),
  })
});

const logQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    userId: z.string().regex(/^\d+$/).transform(Number).optional(),
    action: z.string().max(50).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
});

module.exports = {
  propertySearchSchema,
  logQuerySchema
};
