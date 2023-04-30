import { useUser } from "@clerk/nextjs";
import { type Comment } from "@prisma/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Avatar from "~/components/Avatar";
import { api, type RouterOutputs } from "~/utils/api";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getPostByFollowers"][number];

const PostView = (props: PostWithUser) => {
  const user = useUser();
  const context = api.useContext();
  const { post, author } = props;
  const [isLiked, setIsLiked] = useState(
    props.post.likes.some((like) => like.userId === user.user?.id)
  );
  const [totalLikes, setTotalLikes] = useState(props.post.likes.length);

  const { mutate: mutateLike } = api.posts.toggleLike.useMutation({
    onMutate: () => {
      // Optimistically update to the new value
      setIsLiked(!isLiked);
      setTotalLikes(isLiked ? totalLikes - 1 : totalLikes + 1);
    },
    onSuccess: (data) => {
      // Update the total likes
      if (!data) return;
      setTotalLikes(data.likes.length);
      void context.posts.getPostByFollowers.refetch();
      console.log({
        data,
      });
    },
    onError: () => {
      // Roll back to the previous value
      setIsLiked(!isLiked);
    },
  });

  const onLikeClick = () => {
    if (!user.user) return;
    mutateLike({
      postId: post.id,
      userId: user.user.id,
    });
  };

  if (!user.user) return null;
  if (!user.user.fullName) return null;

  return (
    <article className="flex gap-2 border-b px-4 py-2 ">
      <div className="flex-shrink-0">
        <Avatar />
      </div>
      <div className="flex-1 text-sm">
        <div className="flex gap-1">
          <Link className="hover:underline" href={author.username}>
            {author.fullName}
          </Link>
          <span>&#11825;</span>
          <span className="text-gray-400 ">
            {dayjs(post.createdAt).fromNow()}
          </span>
        </div>
        <p>{post.content}</p>
        {post.image && (
          <Image
            width={500}
            height={500}
            className="my-1 aspect-auto max-h-[500px] w-full rounded border object-contain   "
            src={post.image}
            alt="post image"
          />
        )}

        <article className="flex gap-2.5">
          {post.tags.map((tag) => (
            <Link
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              href={`/${tag.username}`}
              className="text-blue-500 hover:underline"
              key={tag.id}
            >
              @{tag.username}
            </Link>
          ))}
        </article>
        <article className="my-1 w-full rounded-lg px-2 py-1 ">
          <div className="flex gap-2 ">
            <button
              onClick={onLikeClick}
              className={`rounded ${
                isLiked ? "bg-blue-500 text-white" : ""
              } border px-3 py-1`}
            >
              {totalLikes} Like
            </button>
            <button className="rounded border px-3 py-1">
              {post.comments.length} Comments
            </button>
          </div>
        </article>
        <CommentWizard
          name={user.user.fullName}
          comments={post.comments}
          userId={user.user.id}
          postId={post.id}
        />
      </div>
    </article>
  );
};

const CommentWizard = (props: {
  userId: string;
  name: string;
  postId: string;
  comments: Comment[];
}) => {
  const [input, setInput] = useState("");
  const context = api.useContext();
  const { mutate: mutateComment } = api.posts.addComment.useMutation({
    onSuccess: () => {
      setInput("");
      void context.posts.getPostByFollowers.refetch();
      void context.posts.getPostsByUserId.refetch();
    },
  });
  const { name, comments, userId, postId } = props;

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutateComment({
      postId,
      userId,
      name,
      content: input,
    });
  };
  return (
    <section className="w-full">
      <article className="flex gap-2 ">
        <div></div>
        <form onSubmit={onSubmitHandler} className="flex flex-1 gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900  ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            type="text"
          />
          <button className="rounded-lg border bg-blue-500 px-3 py-1.5  capitalize text-white">
            comment
          </button>
        </form>
      </article>
      <section className="mt-2 flex flex-col-reverse gap-1  pl-3">
        {comments.map((comment) => (
          <article key={comment.id} className="flex gap-1 ">
            <div>
              <Avatar />
            </div>
            <div className="rounded-b rounded-tr bg-gray-200 px-4 py-1">
              <div className="font-medium capitalize">{comment.name}</div>
              <div>{comment.content}</div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
};

export default PostView;
