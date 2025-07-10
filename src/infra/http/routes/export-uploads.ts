import { exportUploads } from '@/app/functions/export-uploads';
import { unwrapEither } from '@/shared/either';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

export const exportUploadsRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    '/uploads/exports',
    {
      schema: {
        summary: 'Export uploads',
        tags: ['uploads'],
        querystring: z.object({
          searchQuery: z.string().optional(),
        }),
        response: {
          201: z.object({
            reportUrl: z.string(),
          }),
        },
      },
    },
    async (req, res) => {
      const { searchQuery } = req.query;

      const result = await exportUploads({
        searchQuery,
      });

      const { reportUrl } = unwrapEither(result);

      return res.status(201).send({ reportUrl });
    }
  );
};
