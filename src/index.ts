import { schema } from './../graphql/schema';
const Fastify = require('fastify');
const mercurius = require('mercurius');
const { PrismaClient } = require('@prisma/client');
const Altair = require('altair-fastify-plugin');

const app = Fastify();
const prisma = new PrismaClient();

app.register(mercurius, {
	schema,
	context: (request: unknown, reply: unknown) => {
		return { prisma };
	},
});

app.register(Altair);

app
	.listen(4000)
	.then(() => console.log(`🚀 Server ready at http://localhost:4000/altair`));
