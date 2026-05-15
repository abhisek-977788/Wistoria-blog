import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const message = Object.values(errors).flat().join(', ');
      res.status(400).json({ success: false, message, errors });
      return;
    }
    req.body = result.data;
    next();
  };
};
