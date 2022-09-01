import { Cache, cacheExchange, Resolver } from "@urql/exchange-graphcache";
import {
  ChangePasswordMutation,
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  NewPostMutation,
  PostsDocument,
  PostsQuery,
  RegisterMutation,
  VoteMutation,
} from "generated/graphql";
import { NextUrqlClientConfig } from "next-urql";
import Router from "next/router";
import {
  dedupExchange,
  errorExchange,
  fetchExchange,
  stringifyVariables,
  TypedDocumentNode,
} from "urql";
import { isServer } from "./isServer";

// Implement resolver for cursor pagination
const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);

    const fieldInfos = allFields.filter((fi) => fi.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const customKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(entityKey, customKey);
    // This may be set to true at any point in time (by your custom resolver or by Graphcache) to indicate that some data is uncached and missing
    info.partial = !isItInTheCache;

    let hasMore;

    const items: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const results = cache.resolve(key, "posts") as string[];
      hasMore = cache.resolve(key, "hasMore") as boolean;
      items.push(...results);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore: hasMore ?? true,
      posts: items,
    };
  };
};

const invalidatePosts = (cache: Cache) => {
  const allFields = cache.inspectFields("Query");
  const postFields = allFields.filter((fi) => {
    return fi.fieldName === "posts";
  });

  postFields.forEach((fi) => {
    cache.invalidate("Query", "posts", fi.arguments || {});
  });
}

export const createURQLClient: NextUrqlClientConfig = (ssrExchange, ctx) => {
  // when ssr is enabled for a page, requests are first sent to the nextjs server before being forwarded to the destination api,
  // this request usually contains the users cookies which may be required by the target api.
  // however, by default, next.js does nothing with cookies it receives from the browser.
  // URQL provides a context object that holds info about the request made by the client, including cookies,
  // which we can then manually add to the headers config of the URQL client fetchoptions config.
  // This is an advantage of using a cookie as an auth mechanism vs local storage

  let cookie: string | undefined = "";
  // the urql client gets run both on the alient and server before the request is forwarded to the api,
  // here, we check if we are currently on the server, then we grab the cookie from the context object, and pass it along to the
  // api with the request.
  if (isServer()) {
    cookie = ctx?.req?.headers.cookie;
  }

  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include",
      headers: cookie ? { cookie } : undefined,
    },
    // including `credentials` here is mandatory, to enable cookies to get sent along with
    // a mutation/query request.
    exchanges: [
      dedupExchange,
      cacheExchange({
        // tells UQRL that paginatedposts entity we created has no id. Remember that we didn't give it an id because it's basically functioning as an interface
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            deletePost: (result, args: DeletePostMutationVariables, cache, info) => {
              invalidatePosts(cache)
            },
            login: (result: LoginMutation, args, cache, info) => {
              cache.updateQuery(
                { query: MeDocument as TypedDocumentNode<MeQuery> },
                (data) => {
                  if (result.login.errors) {
                    return data;
                  }
                  return { me: result.login.user };
                }
              );
              invalidatePosts(cache)
            },
            register: (result: RegisterMutation, args, cache, info) => {
              cache.updateQuery(
                { query: MeDocument as TypedDocumentNode<MeQuery> },
                (data) => {
                  if (result.register.errors) {
                    return data;
                  }
                  return { me: result.register.user };
                }
              );
            },
            logout: (result: LogoutMutation, args, cache, info) => {
              cache.updateQuery(
                { query: MeDocument as TypedDocumentNode<MeQuery> },
                (data) => {
                  if (!result.logout) {
                    return data;
                  }
                  return { me: null };
                }
              );
            },
            changePassword(result: ChangePasswordMutation, args, cache, info) {
              cache.updateQuery(
                { query: MeDocument as TypedDocumentNode<MeQuery> },
                (data) => {
                  if (result.changePassword.errors) {
                    return data;
                  }
                  return { me: result.changePassword.user };
                }
              );
            },
            addPost(result: NewPostMutation, args, cache, info) {
              invalidatePosts(cache)
            },
            vote(result: VoteMutation, args, cache, info) {
              cache.updateQuery(
                { query: PostsDocument as TypedDocumentNode<PostsQuery> },
                (data) => {
                  if (data) {
                    const final = data!.posts.posts.map((post) => {
                      if (post.id === result.vote.id) {
                        return result.vote;
                      }
                      return post;
                    });
                    data.posts.posts = final;
                    return data;
                  }
                  return data;
                }
              );
            },
          },
        },
      }),
      errorExchange({
        onError(error) {
          if (error?.message.includes("not authenticated")) {
            Router.replace("/login");
          }
        },
      }),
      ssrExchange,
      fetchExchange,
    ],
  };
};
