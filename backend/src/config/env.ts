import { z } from 'zod';

const environmentSchema = z.object({
  GOOGLE_API_KEY: z.string().trim().min(1).optional(),
  GOOGLE_MODEL: z.string().trim().min(1).default('gemma-4-26b-a4b-it'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export interface Environment {
  googleModel: string;
  clientOrigin: string;
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  googleApiKey?: string;
}

export function loadEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = environmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('The API environment configuration is invalid.');
  }

  const { GOOGLE_API_KEY: googleApiKey, GOOGLE_MODEL, CLIENT_ORIGIN, PORT, NODE_ENV } = parsed.data;
  return {
    googleModel: GOOGLE_MODEL,
    clientOrigin: CLIENT_ORIGIN,
    port: PORT,
    nodeEnv: NODE_ENV,
    ...(googleApiKey ? { googleApiKey } : {}),
  };
}