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
	userId: string;
};

const builder = new SchemaBuilder<{ Objects: { User: User; Post: Post } }>({});

builder.objectType('User', {
	fields: (t) => ({
		id: t.exposeID('id', {}),
		firstName: t.exposeString('first_name', {}),
		lastName: t.exposeString('last_name', {}),
		email: t.exposeString('email', {}),
		posts: t.field({
			type: ['Post'],
			resolve: async (parent) => {
				let posts: Post[] = await prisma.post.findMany({});
				return posts.filter((post: Post) => post.userId === parent.id);
			},
		}),
	}),
});

builder.objectType('Post', {
	fields: (t) => ({
		id: t.exposeID('id', {}),
		title: t.exposeString('title', {}),
		content: t.exposeString('content', {}),
		userId: t.exposeString('userId', {}),
		author: t.field({
			type: 'User',
			resolve: async (parent) => {
				let user: User = await prisma.user.findUnique({
					where: {
						id: parent.userId,
					},
				});
				return user;
			},
		}),
	}),
});

builder.queryType({
	fields: (t) => ({
		// USER QUERY
		user: t.field({
			type: 'User',
			args: {
				id: t.arg.string(),
			},
			resolve: async (parent, args) =>
				await prisma.user.findUnique({ where: { id: args.id } }),
		}),
		// USERS QUERY
		users: t.field({
			type: ['User'],
			resolve: async () => await prisma.user.findMany(),
		}),
		// POSTS QUERY
		posts: t.field({
			type: ['Post'],
			resolve: async () => await prisma.post.findMany(),
		}),
	}),
});

builder.mutationType({
	fields: (t) => ({
		// CREATE USER MUTATION
		createUser: t.field({
			type: 'User',
			args: {
				firstName: t.arg.string(),
				lastName: t.arg.string(),
				email: t.arg.string(),
			},
			resolve: async (parent, args) =>
				await prisma.user.create({
					data: {
						first_name: args.firstName,
						last_name: args.lastName,
						email: args.email,
					},
				}),
		}),
	}),
});

export const schema = builder.toSchema({});
