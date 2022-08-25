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
        <Link href="/forgot-password" passHref>
          <a className="mt-5 text-gray-600 hover:underline">forgot password?</a>
        </Link>
      </Layout>
    </>
  );
};

export default withUrqlClient(createURQLClient, { ssr: true })(Home);
