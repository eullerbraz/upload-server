import { uploadImage } from '@/app/functions/upload-image';
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
          400: z.object({ message: z.string() }),
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

      if (!uploadedFile) {
        return res.status(400).send({ message: 'File is required' });
      }

      // Ao utilizar o to buffer todo o arquivo seria carregado e aplicação ficaria muito pesada
      // const file = await uploadedFile.toBuffer();

      await uploadImage({
        fileName: uploadedFile.filename,
        contentType: uploadedFile.mimetype,
        contentStream: uploadedFile.file,
      });

      return res.status(201).send({ uploadId: '' });
    }
  );
};
