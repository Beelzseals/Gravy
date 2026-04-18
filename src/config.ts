function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
}

export const config = {
  db: {
    url: requireEnv("DATABASE_URL"),
  },
  redis: {
    host: requireEnv("REDIS_HOST"),
    port: parseInt(requireEnv("REDIS_PORT"), 10),
    password: process.env.REDIS_PASSWORD, // optional
  },
  aws: {
    region: requireEnv("AWS_REGION"),
    accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
  },
  email: {
    fromAddress: requireEnv("SES_FROM_ADDRESS"),
  },
  jwt: {
    secret: requireEnv("JWT_SECRET"),
  },
} as const;
