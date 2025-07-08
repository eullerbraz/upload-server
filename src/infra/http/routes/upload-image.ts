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
        consumes: ['multipart/form-data'],
        response: {
          201: z.object({ uploadId: z.string() }),
          409: z
            .object({ message: z.string() })
            .describe('Upload already exists'),
        },
      },
    },
    async (req, res) => {
      const uploadedFile = await req.file({
        limits: {
          fileSize: 1024 * 1024 * 2, // 2mb
        },
      });

      console.log(uploadedFile);

      await db.insert(schema.uploads).values({
        name: 'teste',
        remoteKey: 'teste.jpg',
        remoteUrl: 'http://dsjofiadsjf.com',
      });
      return res.status(201).send({ uploadId: '' });
    }
  );
};
