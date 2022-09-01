import Layout from "components/Layout";
import { Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { MeDocument, MeQuery, useLoginMutation } from "../generated/graphql";
import toErrorMap from "../utils/toErrorMap";
import withApolloClient from "utils/createApolloClient";

const login = () => {
  const [login, { loading } ] = useLoginMutation();
  const router = useRouter();

  return (
    <Layout>
      <Wrapper size="small" className="px-4">
        <h1 className="font-bold text-2xl mb-10">Login</h1>
        <Formik
          initialValues={{ email: "", password: "" }}
          onSubmit={async (details, { setErrors }) => {
            const response = await login({ variables: { details }, update: (cache, {data}) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {__typename: "Query", me: data?.login.user }
              })
              cache.evict({fieldName: "posts"})
            } });
            if (response.data?.login.errors) {
              setErrors(toErrorMap(response.data.login.errors));
            } else if (response.data?.login.user) {
              // check if we redirected from a previous page, and redirect back there after login
              if (typeof router.query?.next === "string") {
                router.replace(router.query.next);
              } else {
                router.replace("/");
              }
            }
          }}
        >
          {({}) => (
            <Form>
              <InputField
                name="email"
                type="email"
                variant="small"
                placeholder="James Dean"
                className="mb-4"
              />
              <InputField
                name="password"
                variant="small"
                placeholder="*********"
                type="password"
              />
              <div className="flex mt-5 items-center">
                <Button type="submit" className="mr-auto">
                  {loading ? "..." : "submit"}
                </Button>
                <Link href="/forgot-password" passHref>
                  <a className="text-blue-600 hover:underline">
                    forgot password?
                  </a>
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default withApolloClient({ssr: false})(login);
