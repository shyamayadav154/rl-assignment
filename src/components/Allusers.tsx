import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { api, type RouterOutputs } from "~/utils/api";
import Avatar from "./Avatar";

const AllUsers = () => {
  const sessionUser = useUser();
  const userId = sessionUser.user?.id;
  if (!userId) return null;
  const { data: users, isLoading } = api.users.getAllUsers.useQuery({
    userId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!users) return <div>No data</div>;

  console.log({
    users,
  });

  return (
    <main className="border-b p-5">
      <h1 className=" text-xl  font-medium">All users</h1>
      <p className="mb-2 text-xs font-medium text-gray-500">
        (follow or unfollow users to see their posts in your feed)
      </p>
      <section className="grid grid-cols-2 gap-2 ">
        {users.map((user) => (
          <SingleUser key={user.id} user={user} />
        ))}
      </section>
    </main>
  );
};

// type User = {
//   id: string;
//   firstName: string | null;
//   lastName: string | null;
//   username: string;
// };cons
type User = RouterOutputs["users"]["getAllUsers"][0];

function SingleUser({ user }: { user: User }) {
  const sessionUser = useUser();
  const context = api.useContext();
  const userId = sessionUser.user?.id;
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const { mutate: followUser, data } = api.users.toggleFollow.useMutation({
    onMutate: () => {
      setIsFollowing((prev) => !prev);
    },
    onSuccess: () => {
      void context.users.getAllUsers.refetch();
      void context.posts.getPostByFollowers.refetch();
    },
    onError: () => {
      setIsFollowing((prev) => !prev);
    },
  });

  const onFollowClick = () => {
    if (!userId) return;
    followUser({
      userId,
      followerId: user.id,
    });
  };

  console.log(data, "followUser");
  return (
    <article className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 ">
        <Avatar />
        <div className="">
          <div className=" whitespace-nowrap">{user.firstName}</div>
          <div className="text-sm font-medium text-gray-400">
            {user.username}
          </div>
        </div>
      </div>
      <button
        onClick={onFollowClick}
        className="rounded bg-blue-500 px-3 py-1.5 text-sm text-white"
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </button>
    </article>
  );
}
export default AllUsers;
