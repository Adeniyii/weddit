import Layout from "components/Layout";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import Link from "next/link";
import { useRouter } from "next/router";
import { createURQLClient } from "utils/createURQLClient";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useRegisterMutation } from "../generated/graphql";
import toErrorMap from "../utils/toErrorMap";

const Register = () => {
  const [{ fetching: registering }, register] = useRegisterMutation();
  const router = useRouter();

  return (
    <Layout>
      <Wrapper size="small" className="px-4">
        <h1 className="font-bold text-2xl mb-10">Register</h1>
        <Formik
          onSubmit={async (details, { setErrors }) => {
            const response = await register({ details });
            if (response.data?.register.errors) {
              setErrors(toErrorMap(response.data.register.errors));
            } else if (response.data?.register.user) {
              router.push("/");
            }
          }}
          initialValues={{ username: "", email: "", password: "" }}
        >
          {({ values, handleChange }) => (
            <Form>
              <InputField
                name="username"
                variant="small"
                placeholder="James Dean"
                className="mb-4"
              />
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
                  {registering ? "..." : "submit"}
                </Button>
                <Link href="/login" passHref>
                  <a className="text-blue-600 hover:underline">
                    Have an account?
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

export default withUrqlClient(createURQLClient)(Register);
