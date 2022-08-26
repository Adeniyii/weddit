import type { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { createURQLClient } from "utils/createURQLClient";
import { usePostsQuery } from "generated/graphql";
import Layout from "components/Layout";
import Link from "next/link";
import PostCard from "components/PostCard";
import Button from "components/Button";

const Home: NextPage = () => {
  const [{ data, fetching }] = usePostsQuery({
    variables: {
      limit: 5,
    },
  });

  return (
    <>
      <Layout>
        <div className="flex items-baseline">
          <h1 className="text-2xl font-bold mr-auto">Posts</h1>
          <Link href="/post" passHref>
            <a className="text-blue-600 hover:underline">New post</a>
          </Link>
        </div>
        <br />
        <ul className="flex flex-col gap-2 w-full">
          {data?.posts
            ? data?.posts.map((post) => <PostCard key={post.id} post={post} />)
            : fetching
            ? "...loading"
            : "No posts"}
        </ul>
        {!fetching && data?.posts ? (
          <Button type="submit" className="mt-5">
            Load more
          </Button>
        ) : null}
      </Layout>
    </>
  );
};

export default withUrqlClient(createURQLClient, { ssr: true })(Home);
