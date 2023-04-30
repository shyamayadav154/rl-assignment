import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const usersRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [user] = await clerkClient.users.getUserList({
        username: [input.username],
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        });
      }

      return user;
    }),
  getAllUsers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const users = await clerkClient.users.getUserList({
        limit: 110,
      });

      const followings = await ctx.prisma.followings.findMany();
      console.log(followings, "....followings");

      const sendRequiredDataFromUsers = users
        .map((user) => ({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isFollowing: followings.some(
            (following) =>
              following.followingId === user.id &&
              following.followerId === input.userId
          )
            ? true
            : false,
        }))
        .filter((user) => user.id !== input.userId);

      return sendRequiredDataFromUsers;
    }),

  toggleFollow: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        followerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const follow = await ctx.prisma.followings.findFirst({
        where: {
          followerId: input.userId,
          followingId: input.followerId,
        },
      });
      if (follow) {
        return await ctx.prisma.followings.delete({
          where: {
            id: follow.id,
          },
        });
      } else {
        return await ctx.prisma.followings.create({
          data: {
            followerId: input.userId,
            followingId: input.followerId,
          },
        });
      }
    }),
});
