import SchemaBuilder from '@pothos/core';
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

type User = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	posts: Post[];
};

type Post = {
	id: string;
	title: string;
	content: string;
	author: User;
};

const builder = new SchemaBuilder<{ Objects: { User: User; Post: Post } }>({});

builder.objectType('User', {
	description: 'A user of the application',
	fields: (t) => ({
		id: t.exposeString('id', {}),
		firstName: t.exposeString('first_name', {}),
		lastName: t.exposeString('last_name', {}),
		email: t.exposeString('email', {}),
	}),
});

builder.objectType('Post', {
	fields: (t) => ({
		id: t.exposeString('id', {}),
		title: t.exposeString('title', {}),
		content: t.exposeString('content', {}),
	}),
});

builder.queryType({
	fields: (t) => ({
		// USER QUERY
		user: t.field({
			type: 'User',
			description: 'Get a single user',
			resolve: () => ({
				id: '1',
				first_name: 'Jane',
				last_name: 'Doe',
				email: 'test',
				posts: [],
			}),
		}),
		// USERS QUERY
		users: t.field({
			type: ['User'],
			description: 'Get an array of all users.',
			resolve: async () => await prisma.user.findMany(),
		}),
		// POSTS QUERY
		posts: t.field({
			type: ['Post'],
			description: 'Get an array of all posts.',
			resolve: async () => await prisma.post.findMany(),
		}),
	}),
});

export const schema = builder.toSchema({});
