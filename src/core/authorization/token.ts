import jwt from "jsonwebtoken";
import { CustomError } from "../error/error.factory";
import { getConfig } from "../../config";

export const TTL = "15m";

interface AccessTokenPayload {
  userId: string;
  orgId: string;
  role: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const config = getConfig();
  return jwt.sign(payload, config.jwt.secret, { expiresIn: TTL });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const config = getConfig();
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AccessTokenPayload;
    return decoded;
  } catch (err) {
    throw new CustomError("Invalid access token", 401);
  }
};
