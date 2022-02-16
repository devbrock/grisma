const Fastify = require('fastify');
const mercurius = require('mercurius');
const { PrismaClient } = require('@prisma/client');
import schema from '../graphql/schema';

const app = Fastify();
const prisma = new PrismaClient();

const resolvers = {
	Query: {
		users: async () => {
			return await prisma.user.findMany();
		},
	},
};

app.register(mercurius, {
	schema,
	resolvers,
	context: (request: unknown, reply: unknown) => {
		return { prisma };
	},
	graphiql: true,
});

app
	.listen(3000)
	.then(() => console.log(`🚀 Server ready at http://localhost:3000/graphiql`));
