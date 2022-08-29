import Layout from "components/Layout";
import { Form, Formik } from "formik";
import { useNewPostMutation } from "generated/graphql";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import { createURQLClient } from "utils/createURQLClient";
import { useIsAuth } from "utils/useIsAuth";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";

const post = () => {
  const [{ fetching }, createPost] = useNewPostMutation();
  const router = useRouter();
  // custom hook to check if there is a current user logged in, and redirects to the login page if no user.
  useIsAuth();

  return (
    <Layout>
      <Wrapper size="medium" className="px-4">
        <h1 className="font-bold text-2xl mb-10">New post</h1>
        <Formik
          initialValues={{ text: "", title: "" }}
          onSubmit={async (details, { setErrors }) => {
            const { error } = await createPost({ details });
            if (!error) {
              router.push("/");
            }
          }}
        >
          {({}) => (
            <Form>
              <InputField
                name="title"
                type="text"
                variant="small"
                placeholder="title"
                className="mb-4"
              />
              <InputField
                name="text"
                variant="small"
                placeholder="text"
                textArea
              />
              <Button type="submit" className="mt-5">
                {fetching ? "..." : "post"}
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default withUrqlClient(createURQLClient)(post);
