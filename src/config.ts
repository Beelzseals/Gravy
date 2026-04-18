import { loadSecrets } from "./secrets";

type AppConfig = {
  db: { url: string };
  redis: { host: string; port: number; password?: string };
  email: { fromAddress: string };
  jwt: { secret: string };
  aws: { region: string; accessKeyId: string; secretAccessKey: string };
};

let config: AppConfig;

function requireSecret(secrets: Record<string, string>, key: string): string {
  const value = secrets[key];
  if (!value) throw new Error(`Secret "${key}" is required but not set.`);
  return value;
}

export async function initConfig() {
  const secrets = await loadSecrets();

  config = {
    db: { url: requireSecret(secrets, "DATABASE_URL") },
    redis: {
      host: requireSecret(secrets, "REDIS_HOST"),
      port: parseInt(requireSecret(secrets, "REDIS_PORT"), 10),
      password: secrets["REDIS_PASSWORD"],
    },
    email: { fromAddress: requireSecret(secrets, "SES_FROM_ADDRESS") },
    jwt: { secret: requireSecret(secrets, "JWT_SECRET") },
    aws: {
      region: requireSecret(secrets, "AWS_REGION"),
      accessKeyId: requireSecret(secrets, "AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireSecret(secrets, "AWS_SECRET_ACCESS_KEY"),
    },
  };
}

export function getConfig(): AppConfig {
  if (!config)
    throw new Error("Config not initialized. Call initConfig() first.");
  return config;
}
