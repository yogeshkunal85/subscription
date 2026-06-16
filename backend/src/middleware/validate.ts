import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';

type ValidationTarget = 'body' | 'query';

/**
 * Factory that returns Express middleware validating req[target] against
 * the provided Joi schema. Passes a structured AppError to next() on failure.
 */
const validate =
  (schema: Joi.Schema, target: ValidationTarget = 'body'): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      return next({ status: 400, code: 'VALIDATION_ERROR', message });
    }

    // Replace req[target] with coerced/stripped value from Joi
    if (target === 'body') {
      req.body = value as Record<string, unknown>;
    } else {
      req.query = value as Record<string, string>;
    }

    next();
  };

export default validate;
