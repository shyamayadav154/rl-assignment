import { useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import AllUsers from "~/components/Allusers";
import Auth from "~/components/Auth";
import Feeds from "~/components/Feeds";
import Header from "~/components/Header";

import { api } from "~/utils/api";

const Home: NextPage = () => {
    const user = useUser();

    if (!user.isLoaded) return null;
    if (!user.isSignedIn) return <Auth />;

    const userId = user.user.id;

    // prefetch all users data
    api.users.getAllUsers.useQuery({
        userId,
    });

    // prefetch all posts data
    api.posts.getPostByFollowers.useQuery({
        userId,
    });

    return (
        <>
            <Head>
                <title>Raftlab assignment</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="mx-auto w-full border-x  md:max-w-2xl">
                <Header />
                <AllUsers />
                <Feeds userId={user.user.id} />
            </main>
        </>
    );
};

export default Home;
