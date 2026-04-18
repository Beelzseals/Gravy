import jwt from "jsonwebtoken";
import { CustomError } from "../error/error.factory";
import { config } from "../../config";

export const TTL = "15m";

interface AccessTokenPayload {
  userId: string;
  orgId: string;
  role: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: TTL });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AccessTokenPayload;
    return decoded;
  } catch (err) {
    throw new CustomError("Invalid access token", 401);
  }
};
