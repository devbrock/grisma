import { FastifyRequest } from 'fastify';
export interface MyContext {
	req: FastifyRequest;
}
