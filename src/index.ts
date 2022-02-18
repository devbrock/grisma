import { schema } from './../graphql/schema';
import Fastify from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifySession from '@mgcrea/fastify-session';
import mercurius from 'mercurius';
import RedisStore from '@mgcrea/fastify-session-redis-store';
import cors from 'fastify-cors';
import { redis } from './redis';

const app = Fastify();

app.register(mercurius, {
	schema,
	path: '/graphql',
	graphiql: true,
	context: ({ req }: any) => req,
});

app.register(cors, {
	credentials: true,
	origin: 'http://localhost:3000',
});

app.register(fastifyCookie);

app.register(fastifySession, {
	store: new RedisStore({ client: redis }),
	secret: 'a secret with minimum length of 32 characters',
	saveUninitialized: true,
	cookieName: 'gsid',
	cookie: {
		httpOnly: true,
		secure: false, // change to true for production
		maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
	},
});

app
	.listen(4000)
	.then(() => console.log(`🚀 Server ready at http://localhost:4000/graphiql`));
