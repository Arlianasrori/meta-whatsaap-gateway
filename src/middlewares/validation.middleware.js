import { ZodError } from 'zod';

/**
 * Middleware untuk validasi request dengan Zod schema
 * @param {Object} schema - Zod schema yang akan digunakan untuk validasi
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors.map(err => err.message).join(', ');
        return res.status(400).json({
          status: 'validation_error',
          message: errorMessage
        });
      }

      return res.status(400).json({
        status: 'error',
        message: 'Validation error'
      });
    }
  };
}; 