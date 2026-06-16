import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { ApiResponse, User } from '../types';

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email } = req.body as { name: string; email: string };
    const user = await userService.createUser(name, email);

    const body: ApiResponse<User> = { success: true, data: user };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
}
