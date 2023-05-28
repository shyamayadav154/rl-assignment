import { useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import AllUsers from "~/components/Allusers";
import Auth from "~/components/Auth";
import Container from "~/components/Container";
import Feeds from "~/components/Feeds";
import Header from "~/components/Header";

const Home: NextPage = () => {
    const user = useUser();

    if (!user.isLoaded) return null;
    if (!user.isSignedIn) return <Auth />;

    return (
        <>
            <Head>
                <title>Raftlab assignment</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Container>
                <Header />
                <AllUsers />
                <Feeds />
            </Container>
        </>
    );
};

export default Home;
