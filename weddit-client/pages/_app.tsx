import "styles/globals.css";
import type { AppProps } from "next/app";
import { Provider, createClient, dedupExchange, fetchExchange, TypedDocumentNode } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import { MeDocument, LoginMutation, MeQuery, RegisterMutation } from "generated/graphql";

const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: {credentials: "include"},
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          login: (result: LoginMutation , args, cache, info) => {
            cache.updateQuery(
              { query: MeDocument as TypedDocumentNode<MeQuery> },
              (data) => {
                if (result.login.errors){
                  return data
                }
                return {me: result.login.user};
              }
            );
          },
          register: (result: RegisterMutation, args, cache, info) => {
            cache.updateQuery({query: MeDocument as TypedDocumentNode<MeQuery>}, (data) => {
              if (result.register.errors){
                return data
              }
              return {me: result.register.user}
            })
          }
        },
      },
    }),
    fetchExchange,
  ],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider value={client}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
