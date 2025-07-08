import { db } from '@/infra/db';
import { schema } from '@/infra/db/schemas';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

export const uploadImageRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        body: z.object({
          name: z.string(),
          password: z.string().optional(),
        }),
        response: {
          201: z.object({ uploadId: z.string() }),
          409: z
            .object({ message: z.string() })
            .describe('Upload already exists'),
        },
      },
    },
    async (_req, res) => {
      await db.insert(schema.uploads).values({
        name: 'teste',
        remoteKey: 'teste.jpg',
        remoteUrl: 'http://dsjofiadsjf.com',
      });
      return res.status(201).send({ uploadId: '' });
    }
  );
};
