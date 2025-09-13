import { log } from '@/infra/logger';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const healthCheckRoute: FastifyPluginAsyncZod = async (server) => {
  server.get('/health', async (_req, res) => {
    log.info('Acessou a rota health');

    return res.status(200).send({ message: 'Tudo OK agora no ECS!' });
  });
};
