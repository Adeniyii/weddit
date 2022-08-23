import { Form, Formik } from "formik";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Wrapper from '../components/Wrapper'

const Register = () => {
  return (
    <Wrapper size="medium" className="pt-[100px]">
      <Formik
        onSubmit={(values) => {
          console.log(values);
        }}
        initialValues={{ username: "", password: "" }}
      >
        {({values, handleChange}) => (
          <Form>
            <InputField name="username" variant="small" placeholder="James Dean" className="mb-4" />
            <InputField name="password" variant="small" placeholder="*********" type="password" />
						<Button className="mt-10 block">submit</Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
