
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const SECRET_NAME = 'deedshield/jwt-keys';
const REGION = process.env.AWS_REGION || 'us-east-1';

// Cache keys in memory to avoid hitting AWS on every request
let cachedKeys: { privateKey: string; publicKey: string } | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

export async function getJwtKeys(): Promise<{ privateKey: string; publicKey?: string }> {
  // 1. Try environment variables first (Dev Mode / Fallback)
  if (process.env.JWT_PRIVATE_KEY) {
    // console.log('[Config] Using JWT_PRIVATE_KEY from environment variables');
    return {
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY
    };
  }

  // 2. Try AWS Secrets Manager
  const now = Date.now();
  if (cachedKeys && (now - lastFetch < CACHE_TTL)) {
    return cachedKeys;
  }

  try {
    // console.log(`[Config] Fetching secret ${SECRET_NAME} from AWS Secrets Manager (${REGION})...`);
    const client = new SecretsManagerClient({ region: REGION });
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: SECRET_NAME,
        VersionStage: 'AWSCURRENT', // VersionStage defaults to AWSCURRENT if unspecified
      })
    );

    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      
      if (!secret.PRIVATE_KEY_PEM) {
        throw new Error('Secret fetched but missing PRIVATE_KEY_PEM field');
      }

      cachedKeys = {
        privateKey: secret.PRIVATE_KEY_PEM,
        publicKey: secret.PUBLIC_KEY_PEM
      };
      lastFetch = now;
      return cachedKeys!;
    } else {
      throw new Error('Secret not found or binary secrets not supported');
    }
  } catch (error) {
    console.warn('[Config] Failed to fetch secrets from AWS:', error);
    throw new Error('Critical: JWT Signing Keys not found in Env or AWS Secrets Manager');
  }
}
