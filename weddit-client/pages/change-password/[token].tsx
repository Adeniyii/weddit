import Button from "components/Button";
import InputField from "components/InputField";
import Layout from "components/Layout";
import Wrapper from "components/Wrapper";
import { Formik, Form } from "formik";
import { MeDocument, MeQuery, useChangePasswordMutation } from "generated/graphql";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toErrorMap from "utils/toErrorMap";
import withApolloClient from "utils/createApolloClient";

const ChangePassword = () => {
  const [changePassword, { loading }] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState<string | null>();
  const router = useRouter();

  useEffect(() => {
    if (tokenError) {
      setTimeout(() => {
        setTokenError(null);
      }, 1500);
    }
  }, [tokenError]);

  return (
    <Layout>
      <Wrapper size="medium" className="pt-[100px]">
        <Formik
          initialValues={{ newPassword: "" }}
          onSubmit={async ({ newPassword }, { setErrors }) => {
            const response = await changePassword({
              variables: {
                newPassword,
                token: (router.query?.token as string) || "",
              },
              update: (cache, {data}) => {
                cache.writeQuery<MeQuery>({
                  query: MeDocument,
                  data: {__typename: "Query", me: data?.changePassword.user}
                })
              }
            });
            if (response.data?.changePassword.errors) {
              const errorMap = toErrorMap(response.data.changePassword.errors);
              if ("token" in errorMap) setTokenError(errorMap.token);
              setErrors(errorMap);
            } else if (response.data?.changePassword.user) {
              router.push("/");
            }
          }}
        >
          {() => (
            <Form>
              <InputField
                name="newPassword"
                type="password"
                label="New Password"
                variant="small"
                placeholder="*********"
                className="mb-4"
              />
              <Button type="submit" className="mt-10 block">
                {loading ? "..." : "submit"}
              </Button>
              {tokenError ? (
                <p className="text-red-500 mt-3 text-center">{tokenError}</p>
              ) : null}
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default withApolloClient({ ssr: false })(ChangePassword);
