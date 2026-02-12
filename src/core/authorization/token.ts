import jwt from "jsonwebtoken";

export const TTL = "15m";

interface AccessTokenPayload {
  userId: string;
  orgId: string;
  role: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: TTL });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as AccessTokenPayload;
    return decoded;
  } catch (err) {
    throw new Error("Invalid token");
  }
};
