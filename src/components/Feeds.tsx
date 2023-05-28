import { api } from "~/utils/api";
import PostView from "./PostView";
import { LoadingSpinner } from "./Loading";

const Feeds = () => {
    const { data: feeds, isLoading, error, isFetching, isError } = api.posts
        .getPostByFollowers.useQuery();

    if (isLoading) return <LoadingSpinner />;
    if (!feeds) return <p>No data</p>;
    if (isError) return <p>Error occurred: {error.message}</p>;

    return (
        <section className=" ">
            {isFetching && <div className="flex justify-end">Feeds updating...</div>}
            <h2 className="flex flex-col px-5 pb-2 pt-5 text-xl font-medium text-gray-800">
                <span>Feeds</span>
                <span className="text-xs text-gray-500">
                    (posts by followed users and you)
                </span>
            </h2>
            <article className="">
                {feeds.map((fullPost) => (
                    <PostView key={fullPost.post.id} {...fullPost} />
                ))}
            </article>
        </section>
    );
};

export default Feeds;
