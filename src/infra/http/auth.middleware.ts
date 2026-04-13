import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { verifyAccessToken } from "../../core/authorization/token";

export interface CustomRequest<P extends ParamsDictionary = ParamsDictionary> extends Request<P> {
  auth?: {
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
    req.auth = {
      userId: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
