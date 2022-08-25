import Button from "components/Button";
import InputField from "components/InputField";
import Layout from "components/Layout";
import Wrapper from "components/Wrapper";
import { Formik, Form } from "formik";
import { useChangePasswordMutation } from "generated/graphql";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import router from "next/router";
import React, { useEffect, useState } from "react";
import { createURQLClient } from "utils/createURQLClient";
import toErrorMap from "utils/toErrorMap";

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const [{ fetching, data }, changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState<string | null>()

  useEffect(() => {
    if (tokenError){
      setTimeout(() => {
        setTokenError(null)
      }, 1500)
    }
  }, [tokenError])

  return (
    <Layout>
      <Wrapper size="medium" className="pt-[100px]">
        <Formik
          initialValues={{ newPassword: "" }}
          onSubmit={async ({ newPassword }, { setErrors }) => {
            const response = await changePassword({ newPassword, token });
            if (response.data?.changePassword.errors) {
              const errorMap = toErrorMap(response.data.changePassword.errors);
              if ('token' in errorMap) setTokenError(errorMap.token)
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
                {fetching ? "..." : "submit"}
              </Button>
              {tokenError ? <p className="text-red-500 mt-3 text-center">{tokenError}</p> : null}
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

ChangePassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default withUrqlClient(createURQLClient)(ChangePassword);
