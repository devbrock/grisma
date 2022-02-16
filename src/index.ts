import { schema } from './../graphql/schema';
const Fastify = require('fastify');
const mercurius = require('mercurius');
const { PrismaClient } = require('@prisma/client');

const app = Fastify();
const prisma = new PrismaClient();

app.register(mercurius, {
	schema,
	context: (request: unknown, reply: unknown) => {
		return { prisma };
	},
	graphiql: true,
});

app
	.listen(3000)
	.then(() => console.log(`🚀 Server ready at http://localhost:3000/graphiql`));
