import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../core/authorization/token";

export interface CustomRequest extends Request {
  user?: {
    userId: string;
    orgId: string;
    role: string;
  };
}

export const authMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
