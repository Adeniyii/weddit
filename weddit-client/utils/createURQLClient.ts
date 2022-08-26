import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import {
  ChangePasswordMutation, LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation
} from "generated/graphql";
import { NextUrqlClientConfig } from "next-urql";
import Router from "next/router";
import {
  dedupExchange, errorExchange, fetchExchange,
  stringifyVariables,
  TypedDocumentNode
} from "urql";

// Implement resolver for cursor pagination
const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    // console.log("parent: ", _parent);
    // console.log("cache: ", cache);
    // console.log("info: ", info);

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

    // const visited = new Set();
    // let result: NullArray<string> = [];
    // let prevOffset: number | null = null;

    // for (let i = 0; i < size; i++) {
    //   const { fieldKey, arguments: args } = fieldInfos[i];
    //   if (args === null || !compareArgs(fieldArgs, args)) {
    //     continue;
    //   }

    //   const links = cache.resolve(entityKey, fieldKey) as string[];
    //   const currentOffset = args[offsetArgument];

    //   if (
    //     links === null ||
    //     links.length === 0 ||
    //     typeof currentOffset !== "number"
    //   ) {
    //     continue;
    //   }

    //   const tempResult: NullArray<string> = [];

    //   for (let j = 0; j < links.length; j++) {
    //     const link = links[j];
    //     if (visited.has(link)) continue;
    //     tempResult.push(link);
    //     visited.add(link);
    //   }

    //   if (
    //     (!prevOffset || currentOffset > prevOffset) ===
    //     (mergeMode === "after")
    //   ) {
    //     result = [...result, ...tempResult];
    //   } else {
    //     result = [...tempResult, ...result];
    //   }

    //   prevOffset = currentOffset;
    // }

    // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    // if (hasCurrentPage) {
    //   return result;
    // } else if (!(info as any).store.schema) {
    //   return undefined;
    // } else {
    //   info.partial = true;
    //   return result;
    // }
  };
};


export const createURQLClient: NextUrqlClientConfig = (ssrExchange) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: { credentials: "include" },
  // including `credentials` here is mandatory, to enable cookies to get sent along with
  // a mutation/query request.
  exchanges: [
    dedupExchange,
    cacheExchange({
      // tells UQRL that paginatedposts entity we created has no id. Remember that we didn't give it an id because it's basically functioning as an interface
      keys: {
        PaginatedPosts: () => null
      },
      resolvers: {
        Query: {
          posts: cursorPagination(),
        }
      },
      updates: {
        Mutation: {
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
});
