import { Form, Formik } from "formik";
import { useMutation } from "urql";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";

const REGISTER_MUT = `
	mutation newUser($values: UserDetails!) {
  register(details: $values) {
    errors {
      field
      message
    }
    user {
      id
      username
    }
  }
}
`;

const Register = () => {
  const [{}, register] = useMutation(REGISTER_MUT);

  return (
    <Wrapper size="medium" className="pt-[100px]">
      <Formik
        onSubmit={(values) => {
          console.log(values);
          register({ values });
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
            <Button className="mt-10 block">submit</Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
