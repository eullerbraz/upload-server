import { db, pg } from '@/infra/db';
import { schema } from '@/infra/db/schemas';
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage';
import { type Either, makeRight } from '@/shared/either';
import { stringify } from 'csv-stringify';
import { ilike } from 'drizzle-orm';
import { PassThrough, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';

const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
});

type ExportUploadsInput = z.input<typeof exportUploadsInput>;

type ExportUploadsOutput = {
  reportUrl: string;
};

export async function exportUploads(
  input: ExportUploadsInput
): Promise<Either<never, ExportUploadsOutput>> {
  const { searchQuery } = exportUploadsInput.parse(input);

  const { sql, params } = db
    .select({
      id: schema.uploads.id,
      name: schema.uploads.name,
      remoteUrl: schema.uploads.remoteUrl,
      createdAt: schema.uploads.createdAt,
    })
    .from(schema.uploads)
    .where(
      searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined
    )
    .toSQL();

  // Semelhante a stream no postgresql, desta forma não exportariamos todos os dados do relatório de uma vez, somente 50 por vez
  const cursor = pg.unsafe(sql, params as string[]).cursor(50);

  // for await (const rows of cursor) {
  //   console.log(rows);
  // }

  const csvTransform = stringify({
    delimiter: ',',
    header: true,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'NAME' },
      { key: 'remote_url', header: 'URL' },
      { key: 'created_at', header: 'Uploaded At' },
    ],
  });

  // Esse transform pega cada linha por ver do DB e coloca uma de cada vez no próximo transform, independende do número de dados que ele recebe do cursor, no caso 50
  const partialTransform = new Transform({
    objectMode: true,
    transform(chunks: unknown[], _encoding, callback) {
      for (const chunk of chunks) {
        this.push(chunk);
      }

      callback();
    },
  });

  const uploadToStorageStream = new PassThrough();

  // READABLE / TRANSFORM / TRANSFORM / TRANSFORM / WRITABLE
  const convertToCsvPipeline = pipeline(
    cursor,
    partialTransform,
    csvTransform,
    uploadToStorageStream
  );

  const uploadToStorage = uploadFileToStorage({
    contentType: 'text/csv',
    folder: 'downloads',
    fileName: `${new Date().toISOString()}-uploads.csv`,
    contentStream: uploadToStorageStream,
  });

  const [{ url }] = await Promise.all([uploadToStorage, convertToCsvPipeline]);

  return makeRight({ reportUrl: url });
}
