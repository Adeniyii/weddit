import { ApolloClient, InMemoryCache } from "@apollo/client";
import { PaginatedPosts } from "generated/graphql";
import { NextPageContext } from "next";
import { withApollo } from "next-apollo";

const client = (ctx: NextPageContext | undefined) => new ApolloClient({
  uri: "http://localhost:4000/graphql",
  headers: {
    cookie: (typeof window === "undefined" ? ctx?.req?.headers.cookie : undefined) || ""
  },
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: false,
            merge(existing: PaginatedPosts, incoming: PaginatedPosts) {
              return {
                __typename: "PaginatedPosts",
                next: incoming.next,
                posts: [...(existing?.posts || []), ...incoming.posts],
              };
            },
          },
        },
      },
    },
  }),
  credentials: "include",
  connectToDevTools: true,
});

export default withApollo(client)
