import cors from 'cors';
import { schema } from './../graphql/schema';
import { redis } from './redis';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { ApolloServerPluginLandingPageGraphQLPlayground } from '.pnpm/apollo-server-core@3.6.3_graphql@16.3.0/node_modules/apollo-server-core';

const main = async () => {
	const server = new ApolloServer({
		schema,
		context: ({ req, res }: any) => ({ req, res }),
		plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
	});

	const app = express();

	const RedisStore = connectRedis(session);

	app.use(
		cors({
			credentials: true,
			origin: 'http://localhost:3000',
		})
	);

	app.use(
		session({
			store: new RedisStore({
				client: redis as any,
			}),
			name: 'gsid',
			secret: 'aslkdfjoiq12312',
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				secure: false, //process.env.NODE_ENV === "production",
				maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
			},
		})
	);

	await server.start();

	server.applyMiddleware({ app });

	app.listen(4000, () => {
		console.log('server started on http://localhost:4000/graphql');
	});
};

main();
