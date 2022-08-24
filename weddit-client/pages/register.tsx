import Layout from "components/Layout";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useMutation } from "urql";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useRegisterMutation } from "../generated/graphql";
import toErrorMap from "../utils/toErrorMap";

const Register = () => {
  const [{}, register] = useRegisterMutation();
  const router = useRouter();

  return (
    <Layout>
      <Wrapper size="medium" className="pt-[100px]">
        <Formik
          onSubmit={async (details, { setErrors }) => {
            const response = await register({ details });
            if (response.data?.register.errors) {
              setErrors(toErrorMap(response.data.register.errors));
            } else if (response.data?.register.user) {
              router.push("/");
            }
          }}
          initialValues={{ username: "", password: "" }}
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
                name="password"
                variant="small"
                placeholder="*********"
                type="password"
              />
              <Button type="submit" className="mt-10 block">submit</Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default Register;
