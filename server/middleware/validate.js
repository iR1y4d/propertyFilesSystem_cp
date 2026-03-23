/**
 * Zod validation middleware factory
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
module.exports = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Attach and overwrite with validated data
      req.body = result.body;
      req.query = result.query || req.query;
      req.params = result.params || req.params;
      req.validated = result;
      next();
    } catch (err) {
      next(err);
    }
  };
};
