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
import { exportUploadsRoute } from './routes/export-uploads';
import { getUploadsRoute } from './routes/get-uploads';
import { transformSwaggerSchema } from './routes/transform-swagger-schema';
import { uploadImageRoute } from './routes/upload-image';

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

server.register(uploadImageRoute);
server.register(getUploadsRoute);
server.register(exportUploadsRoute);

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running!');
});
