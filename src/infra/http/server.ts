import { fastifyCors } from '@fastify/cors';
import { fastify } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { uploadImageRoute } from './routes/upload-image';

const server = fastify();

server.register(fastifyCors, { origin: '*' });

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

server.register(uploadImageRoute);

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running!');
});
