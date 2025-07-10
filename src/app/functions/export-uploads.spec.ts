import { exportUploads } from '@/app/functions/export-uploads';
import * as upload from '@/infra/storage/upload-file-to-storage';
import { isRight, unwrapEither } from '@/shared/either';
import { makeUpload } from '@/test/factores/make-upload';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

describe('export uploads', () => {
  it('should be able to export the uploads', async () => {
    const expectedUrl = 'https://storage.com/image.csv';

    const namePattern = randomUUID();

    const uploadStub = vi
      .spyOn(upload, 'uploadFileToStorage')
      .mockImplementationOnce(async () => {
        return {
          key: `${namePattern}.csv`,
          url: expectedUrl,
        };
      });

    const upload1 = await makeUpload({ name: `${namePattern}.webp` });
    const upload2 = await makeUpload({ name: `${namePattern}.webp` });
    const upload3 = await makeUpload({ name: `${namePattern}.webp` });
    const upload4 = await makeUpload({ name: `${namePattern}.webp` });
    const upload5 = await makeUpload({ name: `${namePattern}.webp` });

    const sut = await exportUploads({
      searchQuery: namePattern,
    });

    const generatedCsvStream = uploadStub.mock.calls[0][0].contentStream;

    const csvAsString = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];

      generatedCsvStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      generatedCsvStream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf-8'));
      });

      generatedCsvStream.on('error', (err) => {
        reject(err);
      });
    });

    const csvAsArray = csvAsString
      .trim()
      .split('\n')
      .map((row) => row.split(','));

    expect(isRight(sut)).toBe(true);
    expect(unwrapEither(sut)).toEqual({ reportUrl: expectedUrl });
    expect(csvAsArray).toEqual([
      ['ID', 'NAME', 'URL', 'Uploaded At'],
      [upload1.id, upload1.name, upload1.remoteUrl, expect.any(String)],
      [upload2.id, upload2.name, upload2.remoteUrl, expect.any(String)],
      [upload3.id, upload3.name, upload3.remoteUrl, expect.any(String)],
      [upload4.id, upload4.name, upload4.remoteUrl, expect.any(String)],
      [upload5.id, upload5.name, upload5.remoteUrl, expect.any(String)],
    ]);
  });
});
