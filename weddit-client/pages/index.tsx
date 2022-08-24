import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { withUrqlClient } from 'next-urql';
import { createURQLClient } from 'utils/createURQLClient';
import { usePostsQuery } from 'generated/graphql';
import Layout from 'components/Layout';

const Home: NextPage = () => {
  const [{data}] = usePostsQuery()
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
      </Layout>
    </>
  );
};

export default withUrqlClient(createURQLClient, { ssr: true })(Home)
