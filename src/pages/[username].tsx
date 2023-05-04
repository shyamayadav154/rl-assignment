import { useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import Avatar from "~/components/Avatar";
import CreatePostWizard from "~/components/CreatePostWizard";
import { LoadingPage } from "~/components/Loading";
import PostView from "~/components/PostView";
import { api } from "~/utils/api";


const ProfilePage: NextPage = () => {
    const router = useRouter();
    const username = router.query.username 
    const session = useUser();
    const currentUsername = session.user?.username;
    const userId = session.user?.id
    if(!session.isLoaded) return null
    if(!userId || !username || !currentUsername) return null
    if(typeof username !== "string") return null

    const { data:userProfileData, isLoading, isError } = api.users.getUserByUsername.useQuery({
        username,
    });


    if (!session.isSignedIn) return null;

    if (isLoading) return <div>Loading...</div>;

    if (!userProfileData) return <div>User data not found</div>;
    if(isError) return <div>Error loading user data</div>

    return (
        <>
            <main className="relative mx-auto min-h-screen w-full border-x  md:max-w-2xl">
                <section className="relative h-36 bg-black ">
                    <div className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full">
                        <Avatar size={144} />
                    </div>
                </section>

                <div className="h-[44px]"></div>
                <div className="p-4 capitalize">
                    {userProfileData.firstName && userProfileData.lastName && (
                        <div className=" text-2xl font-medium">
                            {`${userProfileData.firstName} ${userProfileData.lastName}`}
                        </div>
                    )}
                    <div className=" text-gray-500 ">
                        {`@${userProfileData.username ?? "unknown"}`}
                    </div>
                </div>
                <div className="mb-1 text-center text-xl font-medium text-gray-700">
                    Posts
                </div>
                <div className="w-full border-b border-slate-300" />

                {username === currentUsername && <CreatePostWizard userId={userId} />}
                <ProfileFeed userId={userProfileData.id} />
            </main>
        </>
    );
};

export default ProfilePage;

const ProfileFeed = (props: { userId: string }) => {
    const { data, isLoading, isError } = api.posts.getPostsByUserId.useQuery({
        userId: props.userId,
    });


    if (isLoading) return <LoadingPage />;

    if (!data || data.length === 0) return <div>User has not posted</div>;
    if(isError) return <div>Error loading user posts</div>

    return (
        <div className="flex h-full flex-col overflow-y-auto pb-10">
            {data.map((fullPost) => (
                <PostView
                    {...fullPost}
                    key={fullPost.post.id}
                />
            ))}
        </div>
    );
};
