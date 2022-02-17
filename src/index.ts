import { schema } from './../graphql/schema';
import Fastify from 'fastify';
import mercurius from 'mercurius';

const app = Fastify();

app.register(mercurius, {
	schema,
	graphiql: true,
});

app
	.listen(4000)
	.then(() => console.log(`🚀 Server ready at http://localhost:4000/graphiql`));
