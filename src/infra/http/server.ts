import { DecryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { fastifyCors } from '@fastify/cors';
import { fastifyMultipart } from '@fastify/multipart';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastify } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { log } from '../logger';
import { exportUploadsRoute } from './routes/export-uploads';
import { getUploadsRoute } from './routes/get-uploads';
import { healthCheckRoute } from './routes/health-check';
import { transformSwaggerSchema } from './routes/transform-swagger-schema';
import { uploadImageRoute } from './routes/upload-image';

const ssm = new SSMClient({
  region: 'us-east-1',
});

const kms = new KMSClient({
  region: 'us-east-1',
});

const server = fastify();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.setErrorHandler((error, _req, res) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return res.status(400).send({
      message: 'Validation error.',
      issues: error.validation,
    });
  }

  // Enviar erro para alguma ferramenta de observabilidade (Sentry/Datadog/Grafana/OTel)
  console.error(error);

  return res.status(500).send({ messsage: 'Internal server error.' });
});

server.register(fastifyCors, { origin: '*' });

server.register(fastifyMultipart);

server.register(fastifySwagger, {
  openapi: {
    info: { title: 'Upload server', version: '1.0.0' },
  },
  transform: transformSwaggerSchema,
});

server.register(fastifySwaggerUi, { routePrefix: '/docs' });

server.register(healthCheckRoute);
server.register(uploadImageRoute);
server.register(getUploadsRoute);
server.register(exportUploadsRoute);

server.listen({ port: 3333, host: '0.0.0.0' }).then(async () => {
  // const values = await secret.read('secret/data/upload-server');

  // console.log('Vault Values:', values.data.data);

  const values = await ssm.send(
    new GetParameterCommand({
      Name: 'CLOUDFLARE_ACCOUNT_ID',
      WithDecryption: false,
    })
  );

  if (values.Parameter?.Value) {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(values.Parameter.Value, 'base64'),
    });

    const commandResult = await kms.send(command);

    const result = new TextDecoder().decode(commandResult.Plaintext);

    console.log(result);
  }

  console.log(values);

  log.info('HTTP server running!!!');
});
