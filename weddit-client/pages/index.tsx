import type { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { createURQLClient } from "utils/createURQLClient";
import { usePostsQuery } from "generated/graphql";
import Layout from "components/Layout";
import Link from "next/link";
import PostCard from "components/PostCard";
import Button from "components/Button";
import { useState } from "react";

const Home: NextPage = () => {
  const [variables, setVariables] = useState({cursor: null as null | string, limit: 33})
  const [{ data, fetching }] = usePostsQuery({ variables });

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
            ? data?.posts.posts.map((post) => <PostCard key={post.id} post={post} />)
            : "...loading"}
        </ul>
        {!fetching && data?.posts && data.posts.next ? (
          <Button type="submit" className="mt-5" onClick={() => {
            setVariables(prev => ({...prev, cursor: data.posts.posts[data.posts.posts.length -1].createdAt}))
          }}>
            Load more
          </Button>
        ) : null}
      </Layout>
    </>
  );
};

export default withUrqlClient(createURQLClient, { ssr: true })(Home);
