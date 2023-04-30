import { useSignIn } from "@clerk/clerk-react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import AllUsers from "~/components/Allusers";
import Button from "~/components/Button";
import Header from "~/components/Header";
import { LoadingPage } from "~/components/Loading";
import PostView from "~/components/PostView";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const user = useUser();
  console.log(user.user?.username, "username");
  if (!user.isLoaded) return null;

  if (!user.isSignedIn) return <BeforeAuth />;

  return (
    <>
      <Head>
        <title>Raftlab assignment</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="mx-auto w-full border-x md:max-w-2xl">
        <section className="flex gap-2 ">
          {!user.isSignedIn && (
            <div className="flex gap-4">
              <SignInButton />
              <SignUpButton />
            </div>
          )}
          <Header />
        </section>
        {/* <CreatePostWizard /> */}
        <AllUsers />
        {!!user.isSignedIn && <Feeds userId={user.user.id} />}
      </main>
    </>
  );
};

const BeforeAuth = () => {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();

  const handleDemoLogin = () => {
    if (!isLoaded) return null;
    signIn
      ?.create({
        identifier: "shyamayadav154",
        password: "shyam154",
      })
      .then((res) => {
        console.log(res, "res");
        void router.reload();
      })
      .catch((err) => {
        console.log(err, "err");
      });
  };

  return (
    <main className="grid h-screen place-content-center">
      <h1 className="mb-5 text-center text-2xl font-medium text-gray-800">
        Raftlab Assignment
      </h1>
      <section>
        <article className="w-[400px] space-y-2 ">
          <div className="grid grid-cols-2 gap-2">
            <span className="flex justify-center rounded-lg border px-3 py-1.5">
              <SignInButton />
            </span>
            <span className="flex justify-center rounded-lg border px-3 py-1.5">
              <SignUpButton />
            </span>
          </div>
          <div>
            <Button onClick={handleDemoLogin}>Login as demo user</Button>
          </div>
        </article>
      </section>
    </main>
  );
};

const Feeds = ({ userId }: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostByFollowers.useQuery({
    userId,
  });
  console.log({
    data,
  });
  if (isLoading) return <LoadingPage />;
  if (!data) return <div>No data</div>;
  return (
    <section className=" ">
      <h2 className="flex flex-col px-5 pb-2 pt-5 text-xl font-medium text-gray-800">
        <span>Feeds</span>
        <span className="text-xs text-gray-500">
          (posts by followed users and you)
        </span>
      </h2>
      <article className="px-5">
        {data.map((fullPost) => (
          <PostView key={fullPost.post.id} {...fullPost} />
        ))}
      </article>
    </section>
  );
};

export default Home;
