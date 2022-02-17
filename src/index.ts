import cors from 'cors';
import { schema } from './../graphql/schema';
import { redis } from './redis';
import { ApolloServer } from 'apollo-server-express';
const express = require('express');
import connectRedis from 'connect-redis';
import session from 'express-session';
import { ApolloServerPluginLandingPageGraphQLPlayground } from '.pnpm/apollo-server-core@3.6.3_graphql@16.3.0/node_modules/apollo-server-core';

const main = async () => {
	const server = new ApolloServer({
		schema,
		context: ({ req }: any) => ({ req }),
		plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
	});

	const app = express();

	const RedisStore = connectRedis(session);

	app.use(
		cors({
			credentials: true,
			// origin: 'http://localhost:3000',
			origin: ' https://studio.apollographql.com',
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
				secure: false,
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
