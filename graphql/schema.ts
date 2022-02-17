import SchemaBuilder from '@pothos/core';
const { PrismaClient } = require('@prisma/client');
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type User = {
	id: string;
	first_name: string;
	last_name: string;
	name: string;
	email: string;
	password: string;
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
		name: t.field({
			type: 'String',
			resolve: (parent) => `${parent.first_name} ${parent.last_name}`,
		}),
		email: t.exposeString('email', {}),
		password: t.exposeString('password', {}),
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
				password: t.arg.string(),
			},
			resolve: async (parent, args) => {
				const hashedPassword = await bcrypt.hash(args.password!, 12);
				const user = await prisma.user.create({
					data: {
						first_name: args.firstName,
						last_name: args.lastName,
						email: args.email,
						password: hashedPassword,
					},
				});
				return user;
			},
		}),
		// DELETE USER MUTATION
		deleteUser: t.field({
			type: 'User',
			args: {
				id: t.arg.string(),
			},
			resolve: async (parent, args) =>
				await prisma.user.delete({
					where: {
						id: args.id,
					},
				}),
		}),

		// UPDATE USER MUTATION
		updateUser: t.field({
			type: 'User',
			args: {
				id: t.arg.string(),
				firstName: t.arg.string(),
				lastName: t.arg.string(),
				email: t.arg.string(),
			},
			resolve: async (parent, args) =>
				await prisma.user.update({
					where: { id: args.id },
					data: {
						first_name: args.firstName,
						last_name: args.lastName,
						email: args.email,
					},
				}),
		}),

		// CREATE POST MUTATION
		createPost: t.field({
			type: 'Post',
			args: {
				title: t.arg.string(),
				content: t.arg.string(),
				userId: t.arg.string(),
			},
			resolve: async (parent, args) =>
				await prisma.post.create({
					data: {
						title: args.title,
						content: args.content,
						userId: args.userId,
					},
				}),
		}),
		// DELETE POST MUTATION
		deletePost: t.field({
			type: 'Post',
			args: {
				id: t.arg.string(),
			},
			resolve: async (parent, args) =>
				await prisma.post.delete({ where: { id: args.id } }),
		}),

		// UPDATE POST MUTATION
		updatePost: t.field({
			type: 'Post',
			args: {
				id: t.arg.string(),
				title: t.arg.string(),
				content: t.arg.string(),
				userId: t.arg.string(),
			},
			resolve: async (parent, args) =>
				await prisma.post.update({
					where: { id: args.id },
					data: {
						title: args.title,
						content: args.content,
						userId: args.userId,
					},
				}),
		}),
	}),
});

export const schema = builder.toSchema({});
