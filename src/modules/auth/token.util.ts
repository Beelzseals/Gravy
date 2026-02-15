import crypto from "crypto";

export const generateSecureToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
