import type { NextFunction, Request, Response } from "express";

export const verifyRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.role !== role) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "Forbidden",
      });
    }
    next();
  };
};
