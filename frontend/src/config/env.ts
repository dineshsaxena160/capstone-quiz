import { z } from 'zod';

const frontendEnvironmentSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:3001'),
});

export interface FrontendEnvironment {
  apiBaseUrl: string;
}

export function loadFrontendEnvironment(
  input: Record<string, unknown> = import.meta.env,
): FrontendEnvironment {
  const parsed = frontendEnvironmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('The frontend API URL configuration is invalid.');
  }
  return { apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/$/, '') };
}
