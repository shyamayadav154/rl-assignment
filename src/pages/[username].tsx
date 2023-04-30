import { useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import Avatar from "~/components/Avatar";
import CreatePostWizard from "~/components/CreatePostWizard";
import { LoadingPage } from "~/components/Loading";
import PostView from "~/components/PostView";
import { api } from "~/utils/api";

const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
    userId: props.userId,
  });

  console.log({
    postsByUserId: data,
  });

  if (isLoading) return <LoadingPage />;

  if (!data || data.length === 0) return <div>User has not posted</div>;

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-10">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const username = router.query.username as string;
  const session = useUser();

  const { data, isLoading } = api.users.getUserByUsername.useQuery({
    username,
  });

  const currentUsername = session.user?.username;

  if (!session.isSignedIn) return <div>Not signed in</div>;
  if (!currentUsername) return <div>Current user not found</div>;

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>User data not found</div>;

  return (
    <>
      <main className="relative mx-auto min-h-screen w-full border-x  md:max-w-2xl">
        <section className="relative h-36 bg-black ">
          <div className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full">
            <Avatar size={144} />
          </div>
        </section>

        <div className="h-[44px]"></div>
        <div className="p-4">
          {data.firstName && data.lastName && (
            <div className=" text-2xl font-medium">{`${data.firstName} ${data.lastName}`}</div>
          )}
          <div className=" text-gray-500 ">{`@${
            data.username ?? "unknown"
          }`}</div>
        </div>
        <div className="mb-1 text-center text-xl font-medium text-gray-700">
          Posts
        </div>
        <div className="w-full border-b border-slate-300" />

        {username === currentUsername && <CreatePostWizard />}
        <ProfileFeed userId={data.id} />
      </main>
    </>
  );
};

export default ProfilePage;
