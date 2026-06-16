import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import config from '../config/env';

interface AppError {
  status?: number;
  code?: string;
  message?: string;
  stack?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const isDev = config.nodeEnv !== 'production';

  // MySQL duplicate entry  →  409 Conflict
  if (err.sqlMessage?.includes('Duplicate entry') || err.sqlState === '23000') {
    const body: ApiResponse<never> = {
      success: false,
      error: { code: 'CONFLICT', message: 'A record with that value already exists.' },
    };
    res.status(409).json(body);
    return;
  }

  // Structured AppError thrown by middleware / services
  if (err.status && err.code) {
    const body: ApiResponse<never> = {
      success: false,
      error: { code: err.code, message: err.message ?? 'An error occurred.' },
    };
    res.status(err.status).json(body);
    return;
  }

  // Fallback — unexpected server error
  if (isDev) {
    console.error('[ERROR]', err);
  }

  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? (err.message ?? 'Internal server error') : 'Internal server error',
    },
  };
  res.status(500).json(body);
};

export default errorHandler;
