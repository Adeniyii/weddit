import Button from "components/Button";
import InputField from "components/InputField";
import Layout from "components/Layout";
import Wrapper from "components/Wrapper";
import { Formik, Form } from "formik";
import { useForgotPasswordMutation } from "generated/graphql";
import { withUrqlClient } from "next-urql";
import React from "react";
import { createURQLClient } from "utils/createURQLClient";

const ForgotPassword = () => {
  const [{ fetching, data }, resetPassword] = useForgotPasswordMutation();
  return (
    <Layout>
      <Wrapper size="medium" className="pt-[100px]">
        <Formik
          initialValues={{ email: "" }}
          onSubmit={async ({ email }) => {
            await resetPassword({ email });
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
              <Button type="submit" className="mt-10 block">
                {fetching ? "..." : "submit"}
              </Button>
              {data?.forgotPassword && <p className="text-green-600 text-center mt-3">Reset link sent!</p>}
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default withUrqlClient(createURQLClient)(ForgotPassword);
