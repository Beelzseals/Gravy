import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import * as dotenv from "dotenv";

async function loadFromSecretsManager(): Promise<Record<string, string>> {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: process.env.AWS_SECRET_ID! }),
  );
  return JSON.parse(response.SecretString!);
}

function loadFromDotenv(): Record<string, string> {
  dotenv.config(); // loads .env into process.env
  return process.env as Record<string, string>;
}

export async function loadSecrets(): Promise<Record<string, string>> {
  const env = process.env.NODE_ENV;

  if (env === "production" || env === "staging") {
    console.log("Loading secrets from AWS Secrets Manager...");
    return await loadFromSecretsManager();
  }

  console.log("Loading secrets from .env (local fallback)...");
  return loadFromDotenv();
}
