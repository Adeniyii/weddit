import Layout from "components/Layout";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { createURQLClient } from "utils/createURQLClient";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useLoginMutation } from "../generated/graphql";
import toErrorMap from "../utils/toErrorMap";

const login = () => {
  const [{fetching}, login] = useLoginMutation();
  const router = useRouter();

  return (
    <Layout>
      <Wrapper size="medium" className="pt-[100px]">
        <Formik
          initialValues={{ username: "", password: "" }}
          onSubmit={async (details, { setErrors }) => {
            const response = await login({ details });
            if (response.data?.login.errors) {
              setErrors(toErrorMap(response.data.login.errors));
            } else if (response.data?.login.user) {
              router.push("/");
            }
          }}
        >
          {({}) => (
            <Form>
              <InputField
                name="username"
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
              <Button type="submit" className="mt-10 block">
                {fetching ? "..." : "submit"}
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default withUrqlClient(createURQLClient)(login);
