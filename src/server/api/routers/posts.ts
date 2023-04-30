import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { type Comment, type Like, type Post, type Tag } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
export const filterUserForClient = (user: User) => {
  const fullName =
    user.firstName && user.lastName && `${user.firstName} ${user.lastName}`;
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
    fullName,
    externalUsername:
      user.externalAccounts.find(
        (externalAccount) => externalAccount.provider === "oauth_github"
      )?.username || null,
  };
};

type PostWithLikesAndComments = Post & {
  likes: Like[];
  comments: Comment[];
  tags: Tag[];
};

const addUserDataToPosts = async (posts: PostWithLikesAndComments[]) => {
  const userId = posts.map((post) => post.authorId);
  const users = (
    await clerkClient.users.getUserList({
      userId: userId,
      limit: 110,
    })
  ).map(filterUserForClient);

  if (!users.length) return [];

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author) {
      console.error("AUTHOR NOT FOUND", post);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
      });
    }
    if (!author.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Author has no GitHub Account: ${author.id}`,
      });
    }
    return {
      post,
      author: {
        ...author,
        username: author.username ?? "(username not found)",
      },
    };
  });
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = (await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
      include: {
        likes: true,
        comments: true,
      },
    })) as PostWithLikesAndComments[];

    return addUserDataToPosts(posts);
  }),
  getPostByFollowers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const followers = await ctx.prisma.followings.findMany({
        where: {
          followerId: input.userId,
        },
      });

      const posts = (await ctx.prisma.post.findMany({
        where: {
          authorId: {
            in: [
              ...followers.map((follower) => follower.followingId),
              input.userId,
            ],
          },
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
        include: {
          tags: true,
          likes: true,
          comments: true,
        },
      })) as PostWithLikesAndComments[];

      return addUserDataToPosts(posts);
    }),

  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = (await ctx.prisma.post.findMany({
        where: { authorId: input.userId },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
        include: {
          likes: true,
          comments: true,
          tags: true,
        },
      })) as PostWithLikesAndComments[];

      return addUserDataToPosts(posts);
    }),

  toggleLike: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const like = await ctx.prisma.like.findFirst({
        where: {
          postId: input.postId,
          userId: input.userId,
        },
      });
      if (like) {
        await ctx.prisma.like.delete({
          where: {
            id: like.id,
          },
        });
      } else {
        await ctx.prisma.like.create({
          data: {
            postId: input.postId,
            userId: input.userId,
          },
        });
      }
      const post = await ctx.prisma.post.findUnique({
        where: {
          id: input.postId,
        },
        include: {
          likes: true,
        },
      });
      return post;
    }),
  addComment: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        userId: z.string(),
        name: z.string(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          postId: input.postId,
          name: input.name,
          userId: input.userId,
          content: input.content,
        },
      });
      return comment;
    }),

  create: publicProcedure
    .input(
      z.object({
        content: z.string().min(1).max(1000),
        authorId: z.string().min(1).max(1000),
        image: z.string().optional(),
        tags: z
          .array(
            z.object({
              username: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const image = input.image;
      console.log({ image });
      const post = await ctx.prisma.post.create({
        data: {
          authorId: input.authorId,
          content: input.content,
          image: input.image,
        },
      });

      if (input.tags) {
        await ctx.prisma.tag.createMany({
          data: input.tags.map((tag) => ({
            username: tag.username,
            postId: post.id,
          })),
        });
      }

      return post;
    }),
});
