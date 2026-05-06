import crypto from "crypto";
import { CookieOptions } from "express";

export const REFRESH_COOKIE = "refreshToken";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/auth",
};

export const generateSecureToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
