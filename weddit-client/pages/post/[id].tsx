import Layout from "components/Layout";
import { usePostQuery } from "generated/graphql";
import { useRouter } from "next/router";
import React from "react";
import withApolloClient from "utils/createApolloClient"

const post = () => {
  const router = useRouter();
  const { data, error, loading } = usePostQuery({
    variables: { id: parseInt(router.query.id as string) },
  });

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p>{error.message}</p>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <p>Could not find post</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-[70px] text-center">
        {data.post.title}
      </h1>
      <p>{data.post.text}</p>
    </Layout>
  );
};

export default withApolloClient({ssr: true})(post);
