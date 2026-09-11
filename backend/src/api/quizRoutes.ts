import { Router, type RequestHandler } from 'express';
import { generateQuizRequestSchema, type QuizResponse } from '@quiz/contracts';
import { invalidRequestError } from './errors.js';
import type { QuizGenerator } from '../quiz/types.js';

export function createQuizRouter(generator: QuizGenerator): Router {
  const router = Router();
  const pendingRequests = new Map<string, Promise<QuizResponse>>();
  const generateHandler: RequestHandler = async (request, response, next) => {
    try {
      const parsed = generateQuizRequestSchema.safeParse(request.body);
      if (!parsed.success) throw invalidRequestError();

      const controller = new AbortController();
      request.on('aborted', () => controller.abort());
      const existing = pendingRequests.get(request.requestId);
      if (existing) {
        const quiz = await existing;
        response.status(200).json(quiz);
        return;
      }

      const generation = generator.generate(parsed.data.topic, {
        signal: controller.signal,
        requestId: request.requestId,
      });
      pendingRequests.set(request.requestId, generation);
      const quiz = await generation;
      response.status(200).json(quiz);
      if (pendingRequests.get(request.requestId) === generation) {
        pendingRequests.delete(request.requestId);
      }
    } catch (error) {
      pendingRequests.delete(request.requestId);
      next(error);
    }
  };

  router.post('/generate', generateHandler);
  return router;
}