import type { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { createURQLClient } from "utils/createURQLClient";
import { usePostsQuery } from "generated/graphql";
import Layout from "components/Layout";
import Link from "next/link";

const Home: NextPage = () => {
  const [{ data }] = usePostsQuery();

  return (
    <>
      <Layout>
        <h1>Hello world</h1>
        <br />
        <ul>
          {data?.posts
            ? data?.posts.map((post) => <li key={post.id}>{post.title}</li>)
            : "...loading"}
        </ul>
        <div className="flex flex-col">
          <Link href="/forgot-password" passHref>
            <a className="mt-5 text-blue-600 hover:underline">
              forgot password?
            </a>
          </Link>
          <Link href="/post" passHref>
            <a className="mt-5 text-blue-600 hover:underline">post</a>
          </Link>
        </div>
      </Layout>
    </>
  );
};

export default withUrqlClient(createURQLClient, { ssr: true })(Home);
