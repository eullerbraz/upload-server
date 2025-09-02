import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const healthCheckRoute: FastifyPluginAsyncZod = async (server) => {
  server.get('/health', async (_req, res) => {
    return res.status(200).send({ message: 'Tudo OK agora no ECS!' });
  });
};
