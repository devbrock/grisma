import { JsonObject, typeJsonObject } from 'type-fest';
import SchemaBuilder from '@pothos/core';
import ValidationPlugin, { createZodSchema } from '@pothos/plugin-validation';
const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';
import { MyContext } from './types/MyContext';

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

const nameValidation = createZodSchema({ minLength: 1, maxLength: 5 });

const builder = new SchemaBuilder<{
	Objects: { User: User; Post: Post };
	Context: MyContext;
}>({
	plugins: [ValidationPlugin],
});

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
		// ME QUERY
		me: t.field({
			type: 'User',
			nullable: true,
			resolve: async (parent, args, ctx) => {
				console.log(ctx.req.session.userId);
				if (!ctx.req.session.userId) {
					return null;
				}
				return await prisma.user.findUnique({
					where: { id: ctx.req.session.userId },
				});
			},
		}),
	}),
});

builder.mutationType({
	fields: (t) => ({
		// CREATE USER MUTATION aka Register
		createUser: t.field({
			type: 'User',
			args: {
				firstName: t.arg.string({
					validate: {
						schema: nameValidation,
					},
				}),
				lastName: t.arg.string({
					validate: {
						schema: nameValidation,
					},
				}),
				email: t.arg.string({
					validate: {
						email: [true, { message: 'invalid email address' }],
					},
				}),
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

		// LOGIN MUTATION
		login: t.field({
			type: 'User',
			nullable: true,
			args: {
				email: t.arg.string({
					validate: {
						email: [true, { message: 'not a valid email' }],
					},
				}),
				password: t.arg.string({}),
			},
			resolve: async (parent, args, ctx) => {
				const user = await prisma.user.findUnique({
					where: {
						email: args.email,
					},
				});

				if (!user) {
					return null;
				}

				const isMatch = await bcrypt.compare(args.password!, user.password);

				if (!isMatch) {
					return null;
				}

				ctx.req.session.userId = user.id;
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
				firstName: t.arg.string({
					validate: {
						schema: nameValidation,
					},
				}),
				lastName: t.arg.string({
					validate: {
						schema: nameValidation,
					},
				}),
				email: t.arg.string({
					validate: {
						email: [true, { message: 'invalid email address' }],
					},
				}),
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
