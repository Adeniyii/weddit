import { cacheExchange } from "@urql/exchange-graphcache";
import {
  ChangePasswordMutation, LoginMutation, LogoutMutation, MeDocument, MeQuery, NewPostMutation,
  PostsDocument,
  PostsQuery, RegisterMutation
} from "generated/graphql";
import { NextUrqlClientConfig } from "next-urql";
import Router from "next/router";
import {
  dedupExchange, errorExchange, fetchExchange,
  TypedDocumentNode
} from "urql";

// This is an optional custom errorExchange for catching global errors,
// URQL now provides a default error exchange, so this is not needed anymore.
// import { pipe, tap } from 'wonka'
/* const errorExchange: Exchange = ({forward}) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({error}) => {
      if (error?.message.includes('not authenticated')){
        Router.replace("/login")
      }
    })
  )
} */

export const createURQLClient: NextUrqlClientConfig = (ssrExchange) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: { credentials: "include" },
  // including `credentials` here is mandatory, to enable cookies to get sent along with
  // a mutation/query request.
  exchanges: [
    dedupExchange,
    cacheExchange({
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
          addPost: (result: NewPostMutation, args, cache, info) => {
            cache.updateQuery(
              { query: PostsDocument as TypedDocumentNode<PostsQuery> },
              (data) => {
                data?.posts.push(result.addPost);
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
});
