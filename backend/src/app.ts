import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { loadEnvironment, type Environment } from './config/env.js';
import { DEFAULT_LIMITS, type GenerationLimits } from './config/limits.js';
import { createQuizRouter } from './api/quizRoutes.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { requestIdMiddleware } from './api/middleware/requestId.js';
import { healthHandler } from './api/health.js';
import { createQuizGenerator } from './quiz/generateQuiz.js';
import type { QuizGenerator } from './quiz/types.js';
import { createProvider } from './provider/createProvider.js';
import type { QuizProvider } from './provider/types.js';

export interface AppDependencies {
  environment?: Environment;
  limits?: GenerationLimits;
  provider?: QuizProvider;
  generator?: QuizGenerator;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const environment = dependencies.environment ?? loadEnvironment();
  const limits = dependencies.limits ?? DEFAULT_LIMITS;
  const provider = dependencies.provider ?? createProvider(environment);
  const generator =
    dependencies.generator ?? createQuizGenerator({ environment, provider, limits });
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(requestIdMiddleware);
  app.use(
    cors({
      origin: (origin, callback) => callback(null, origin === undefined || origin === environment.clientOrigin),
      credentials: false,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'X-Request-Id'],
    }),
  );
  app.use(express.json({ limit: `${limits.requestBodyBytes}b`, strict: true }));
  app.use(
    rateLimit({
      windowMs: limits.rateLimitWindowMs,
      limit: limits.rateLimitMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  app.get('/health', healthHandler);
  app.use('/api/quiz', createQuizRouter(generator));
  app.use(errorHandler);
  return app;
}
