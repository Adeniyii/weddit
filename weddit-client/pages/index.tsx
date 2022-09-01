import type { NextPage } from "next";
import { usePostsQuery } from "generated/graphql";
import Layout from "components/Layout";
import Link from "next/link";
import PostCard from "components/PostCard";
import Button from "components/Button";
import withApolloClient from "utils/createApolloClient"

const Home = () => {
  const { data, loading, fetchMore, variables } = usePostsQuery({
    variables: { cursor: null, limit: 15 }, notifyOnNetworkStatusChange: true
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
            ? data?.posts.posts.map((post) => !post ? null : <PostCard key={post.id} post={post} />)
            : "...loading"}
        </ul>
        {!loading && data?.posts && data.posts.next ? (
          <Button type="submit" className="mt-5" onClick={() => {
            fetchMore({
              variables: {
                ...variables,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt
              },
              // updateQuery(previousQueryResult, {fetchMoreResult}) {
              //   if (!fetchMoreResult) return previousQueryResult

              //   return {
              //     __typename: "Query",
              //     posts: {
              //       __typename: "PaginatedPosts",
              //       next: fetchMoreResult.posts.next,
              //       posts: [...previousQueryResult.posts.posts, ...fetchMoreResult.posts.posts]
              //     }
              //   }
              // },
            })
          }}>
            Load more
          </Button>
        ) : null}
      </Layout>
    </>
  );
};

export default withApolloClient({ssr: true})(Home);
