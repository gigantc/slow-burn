//////////////////////////////////////
// App factory

import secureSession from '@fastify/secure-session';
import fastifyStatic from '@fastify/static';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { guardedAuthRoutes, publicAuthRoutes } from './auth/routes.js';
import { requireAuth } from './auth/guard.js';
import './auth/session.js';
import { config } from './config.js';
import { errorBody, errorHandler } from './errors.js';
import { cookRoutes } from './routes/cooks.js';
import { healthRoutes } from './routes/health.js';
import { photoRoutes } from './routes/photos.js';
import { tastingRoutes } from './routes/tastings.js';

export const buildApp = async () => {
  const app = Fastify({
    logger: { level: config.isProd ? 'info' : 'debug' },
    trustProxy: config.isProd,
  }).withTypeProvider<TypeBoxTypeProvider>();

  app.setErrorHandler(errorHandler);

  await app.register(secureSession, {
    key: Buffer.from(config.sessionKey, 'hex'),
    cookieName: config.sessionCookie,
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProd,
      maxAge: config.sessionMaxAgeSeconds,
    },
  });

  //////////////////////////////////////
  // API

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(publicAuthRoutes);

      await api.register(async (guarded) => {
        guarded.addHook('preHandler', requireAuth);
        await guarded.register(guardedAuthRoutes);
        await guarded.register(cookRoutes);
        await guarded.register(tastingRoutes);
        await guarded.register(photoRoutes);
      });
    },
    { prefix: '/api' },
  );

  //////////////////////////////////////
  // Client (built by Vite) with SPA fallback

  await app.register(fastifyStatic, {
    root: config.clientDir,
    setHeaders: (reply, path) => {
      // index.html and the service worker must always revalidate; hashed assets never change.
      const revalidate = /(index\.html|sw\.js|registerSW\.js|manifest\.webmanifest)$/.test(path);
      reply.header(
        'Cache-Control',
        revalidate ? 'no-cache' : 'public, max-age=31536000, immutable',
      );
    },
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api/')) {
      return reply.header('Cache-Control', 'no-cache').sendFile('index.html');
    }
    return reply.status(404).send(errorBody('not_found', 'Not found.'));
  });

  return app;
};
